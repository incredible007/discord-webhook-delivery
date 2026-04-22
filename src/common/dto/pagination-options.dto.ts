import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsInt, Max, Min } from 'class-validator'

export class PaginationOptions {
    @ApiPropertyOptional({
        description: 'Номер страницы',
        example: 1,
        default: 1,
    })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number = 1

    @ApiPropertyOptional({
        description: 'Количество элементов на странице',
        example: 20,
        default: 20,
    })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(1_000)
    limit: number = 20
}
