import { IsString, IsNotEmpty, IsInt, IsPositive, MaxLength } from 'class-validator';

/**
 * Nova versão de um documento existente.
 *
 * Regra crítica: versões são imutáveis.
 * Jamais atualizar ou excluir uma versão existente.
 * O número de versão é calculado automaticamente (MAX + 1).
 *
 * Estrutura preparada para assinatura digital futura via is_signed.
 */
export class CreateDocumentVersionDto {
  /** URL do arquivo no storage (nova versão do arquivo). */
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  file_url: string;

  /** MIME type do arquivo (ex: application/pdf). */
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  mime_type: string;

  /** Tamanho do arquivo em bytes. */
  @IsInt()
  @IsPositive()
  size: number;
}
