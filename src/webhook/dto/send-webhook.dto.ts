import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator'

export class SendWebhookDto {
    @IsString()
    @IsNotEmpty()
    title: string

    @IsString()
    @IsNotEmpty()
    description: string

    @IsNumber()
    @IsOptional()
    color?: number

    @IsOptional()
    footer?: { text: string }
}
