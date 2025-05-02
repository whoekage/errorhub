import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey } from 'typeorm';

export class CreateErrorCategoryTable1633123456 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create error_categories table
    await queryRunner.createTable(
      new Table({
        name: 'error_categories',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true
    );

    // Create default categories
    await queryRunner.query(`
      INSERT INTO error_categories (name, description) 
      VALUES 
        ('GENERAL', 'General error codes'),
        ('VALIDATION', 'Validation related error codes'),
        ('AUTH', 'Authentication related error codes'),
        ('PERMISSION', 'Permission related error codes'),
        ('NOT_FOUND', 'Not found error codes'),
        ('SERVER', 'Server error codes')
    `);

    // Add categoryId column to error_codes table
    await queryRunner.addColumn(
      'error_codes',
      new TableColumn({
        name: 'categoryId',
        type: 'integer',
        isNullable: true, // Allow null initially for migration
      })
    );

    // Update existing error codes to use the GENERAL category (id=1)
    await queryRunner.query(`
      UPDATE error_codes SET categoryId = 1
    `);

    // Now make the column not nullable
    await queryRunner.changeColumn(
      'error_codes',
      'categoryId',
      new TableColumn({
        name: 'categoryId',
        type: 'integer',
        isNullable: false,
      })
    );

    // Add foreign key constraint
    await queryRunner.createForeignKey(
      'error_codes',
      new TableForeignKey({
        columnNames: ['categoryId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'error_categories',
        onDelete: 'RESTRICT', // Don't allow deleting categories used by error codes
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraint first
    const table = await queryRunner.getTable('error_codes');
    if (table) {
      const foreignKey = table.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('categoryId') !== -1
      );
      if (foreignKey) {
        await queryRunner.dropForeignKey('error_codes', foreignKey);
      }
    }

    // Drop categoryId column
    await queryRunner.dropColumn('error_codes', 'categoryId');

    // Drop error_categories table
    await queryRunner.dropTable('error_categories');
  }
} 