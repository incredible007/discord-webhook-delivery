import { IsEmail, IsNotEmpty } from 'class-validator'

export class SendWebhookDto {
    @IsEmail()
    @IsNotEmpty()
    email: string
}
