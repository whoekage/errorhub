import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class MakeCategoryIdNullable1633123457 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Получаем таблицу error_codes
    const table = await queryRunner.getTable('error_codes');
    
    // Если таблица существует
    if (table) {
      // Удаляем существующий внешний ключ
      const foreignKey = table.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('categoryId') !== -1
      );
      
      if (foreignKey) {
        await queryRunner.dropForeignKey('error_codes', foreignKey);
      }
      
      // Изменяем колонку categoryId на nullable
      await queryRunner.changeColumn(
        'error_codes',
        'categoryId',
        new TableColumn({
          name: 'categoryId',
          type: 'integer',
          isNullable: true,
        })
      );
      
      // Создаем новый внешний ключ с правильными параметрами
      await queryRunner.createForeignKey(
        'error_codes',
        new TableForeignKey({
          columnNames: ['categoryId'],
          referencedColumnNames: ['id'],
          referencedTableName: 'error_categories',
          onDelete: 'RESTRICT',
        })
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Получаем таблицу error_codes
    const table = await queryRunner.getTable('error_codes');
    
    // Если таблица существует
    if (table) {
      // Удаляем существующий внешний ключ
      const foreignKey = table.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('categoryId') !== -1
      );
      
      if (foreignKey) {
        await queryRunner.dropForeignKey('error_codes', foreignKey);
      }
      
      // Изменяем колонку categoryId обратно на not nullable
      await queryRunner.changeColumn(
        'error_codes',
        'categoryId',
        new TableColumn({
          name: 'categoryId',
          type: 'integer',
          isNullable: false,
        })
      );
      
      // Создаем новый внешний ключ с оригинальными параметрами
      await queryRunner.createForeignKey(
        'error_codes',
        new TableForeignKey({
          columnNames: ['categoryId'],
          referencedColumnNames: ['id'],
          referencedTableName: 'error_categories',
          onDelete: 'RESTRICT',
        })
      );
    }
  }
} 