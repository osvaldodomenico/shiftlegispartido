import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateCampaignDto, CampaignStatus } from './create-campaign.dto';

export class UpdateCampaignDto extends PartialType(CreateCampaignDto) {
  @IsEnum(CampaignStatus)
  @IsOptional()
  status?: CampaignStatus;
}
