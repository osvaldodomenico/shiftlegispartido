import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';
import { JwtPayload } from '../../../common/decorators/current-user.decorator';

@Injectable()
export class DeviceTokensService {
  constructor(private readonly prisma: PrismaService) {}

  async register(dto: RegisterDeviceTokenDto, actor: JwtPayload) {
    const deviceToken = await this.prisma.device_tokens.upsert({
      where: {
        user_id_token: {
          user_id: BigInt(actor.userId),
          token: dto.token,
        },
      },
      create: {
        user_id: BigInt(actor.userId),
        tenant_id: BigInt(actor.tenantId),
        token: dto.token,
        platform: dto.platform,
      },
      update: {
        platform: dto.platform,
        updated_at: new Date(),
      },
      select: {
        id: true,
        token: true,
        platform: true,
        created_at: true,
      },
    });

    return {
      success: true,
      data: {
        ...deviceToken,
        id: deviceToken.id.toString(),
      },
      message: 'Device token registrado',
    };
  }

  async unregister(token: string, actor: JwtPayload) {
    const result = await this.prisma.device_tokens.deleteMany({
      where: {
        token,
        user_id: BigInt(actor.userId),
        tenant_id: BigInt(actor.tenantId),
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Device token não encontrado');
    }

    return { success: true, message: 'Device token removido' };
  }
}
