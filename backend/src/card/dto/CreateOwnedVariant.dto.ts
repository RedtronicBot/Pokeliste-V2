import { IsInt } from "class-validator"

export class CreateOwnedVariantDto {
  @IsInt()
  normal: number

  @IsInt()
  holo: number

  @IsInt()
  reverse: number

  @IsInt()
  firstEdition: number

  @IsInt()
  secondEdition: number
}
