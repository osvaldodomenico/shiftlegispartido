import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { JwtPayload } from '../../../common/decorators/current-user.decorator';
import { parse } from 'csv-parse';
import { Readable } from 'stream';

// Colunas esperadas no CSV: name, email, phone, type
interface CsvRow {
  name?: string;
  email?: string;
  phone?: string;
  type?: string;
}

@Injectable()
export class CrmImportService {
  constructor(private readonly prisma: PrismaService) {}

  async startImport(file: Express.Multer.File, actor: JwtPayload) {
    // Cria registro de importação com status processing
    const importRecord = await this.prisma.crm_imports.create({
      data: {
        tenant_id: BigInt(actor.tenantId),
        created_by: BigInt(actor.userId),
        filename: file.originalname,
        status: 'processing',
      },
    });

    // Processa em background (fire and forget)
    this.processImport(importRecord.id, file.buffer, actor).catch((err) =>
      console.error(`Import ${importRecord.id} failed:`, err),
    );

    return {
      success: true,
      data: { id: importRecord.id.toString(), status: 'processing' },
      message: 'Importação iniciada',
    };
  }

  private async processImport(importId: bigint, buffer: Buffer, actor: JwtPayload) {
    const rows: CsvRow[] = await this.parseCsv(buffer);
    let imported = 0;
    let skipped = 0;
    const errors: Array<{ row: number; message: string }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        if (!row.name) {
          skipped++;
          errors.push({ row: i + 2, message: 'Campo "name" obrigatório' });
          continue;
        }

        await this.prisma.people.create({
          data: {
            tenant_id: BigInt(actor.tenantId),
            name: row.name.trim(),
            email: row.email?.trim() || null,
            phone: row.phone?.trim() || null,
            type: (row.type?.trim() as any) || 'simpatizante',
          },
        });
        imported++;
      } catch (err: any) {
        skipped++;
        errors.push({ row: i + 2, message: err.message });
      }
    }

    await this.prisma.crm_imports.update({
      where: { id: importId },
      data: {
        status: imported === 0 && skipped > 0 ? 'failed' : 'done',
        total: rows.length,
        imported,
        skipped,
        errors: errors.length > 0 ? (errors as any) : null,
      },
    });

    await this.prisma.audit_logs.create({
      data: {
        tenant_id: BigInt(actor.tenantId),
        user_id: BigInt(actor.userId),
        action: 'CREATE',
        entity: 'crm_imports',
        entity_id: importId,
        metadata: { data: JSON.stringify({ imported, skipped }) },
      },
    });
  }

  private parseCsv(buffer: Buffer): Promise<CsvRow[]> {
    return new Promise((resolve, reject) => {
      const rows: CsvRow[] = [];
      const stream = Readable.from(buffer);
      stream
        .pipe(parse({ columns: true, trim: true, skip_empty_lines: true }))
        .on('data', (row: CsvRow) => rows.push(row))
        .on('end', () => resolve(rows))
        .on('error', reject);
    });
  }

  async getImportStatus(id: string, actor: JwtPayload) {
    const record = await this.prisma.crm_imports.findFirst({
      where: { id: BigInt(id), tenant_id: BigInt(actor.tenantId) },
      select: {
        id: true,
        filename: true,
        status: true,
        total: true,
        imported: true,
        skipped: true,
        errors: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!record) throw new NotFoundException('Importação não encontrada');

    return {
      success: true,
      data: {
        ...record,
        id: record.id.toString(),
      },
    };
  }

  async listImports(actor: JwtPayload) {
    const records = await this.prisma.crm_imports.findMany({
      where: { tenant_id: BigInt(actor.tenantId) },
      select: {
        id: true,
        filename: true,
        status: true,
        total: true,
        imported: true,
        skipped: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: { created_at: 'desc' },
      take: 50,
    });

    return {
      success: true,
      data: records.map((r) => ({ ...r, id: r.id.toString() })),
    };
  }
}
