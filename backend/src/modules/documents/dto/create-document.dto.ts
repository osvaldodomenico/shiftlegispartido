import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsInt,
  IsPositive,
  MaxLength,
  Min,
} from 'class-validator';

export enum DocumentType {
  ATA = 'ata',
  CONTRATO = 'contrato',
  PESSOAL = 'pessoal',
  FINANCEIRO = 'financeiro',
}

export enum EntityType {
  PEOPLE = 'people',
  FINANCIAL = 'financial',
  CAMPAIGN = 'campaign',
  GENERAL = 'general',
}

/**
 * Cria o documento e a versão 1 atomicamente.
 * O campo file_url referencia a URL do arquivo já enviado ao storage.
 * A primeira versão é imutável e nunca pode ser sobrescrita.
 */
export class CreateDocumentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsEnum(DocumentType)
  type: DocumentType;

  @IsEnum(EntityType)
  entity_type: EntityType;

  /**
   * ID da entidade relacionada (pessoa, lançamento, etc.).
   * Obrigatório quando entity_type != 'general'.
   * O backend valida que entity_id pertence ao mesmo tenant.
   */
  @IsOptional()
  @IsInt()
  @Min(1)
  entity_id?: number;

  // ─── Campos da versão 1 ───────────────────────────────────────────────────

  /** URL do arquivo no storage (ex: S3, R2). Máx 2048 chars. */
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  file_url: string;

  /** MIME type do arquivo (ex: application/pdf, image/jpeg). */
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  mime_type: string;

  /** Tamanho do arquivo em bytes. */
  @IsInt()
  @IsPositive()
  size: number;
}
