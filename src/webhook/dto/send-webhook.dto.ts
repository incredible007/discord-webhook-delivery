import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty } from 'class-validator'

export class SendWebhookDto {
    @ApiProperty({
        example: 'user@example.com',
        description: 'Email пользователя который зарегистрировался',
    })
    @IsEmail()
    @IsNotEmpty()
    email: string
}
