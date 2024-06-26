import { client } from '../client';

const internal = client.schema.withSchema('internal');

export namespace tables {
  export const animal = internal.createTable('animal', (table) => {
    table.increments('id').primary().unique();
    table.string('name', 255).notNullable();

    // Recommended: 255 fits a format like /data/apam/animal/profilepic/{id}.jpeg
    table.string('profilepic_path', 255).nullable();

    table.tinyint('age').unsigned().notNullable();
    table.enum('gender', ['male', 'female']);
    table.enum('status', ['adopted', 'homeless', 'deceased']);
    table.enum('species', ['cat', 'dog']);
  });

  export const campaign = internal.createTable('campaign', (table) => {
    table.increments('id').primary().unique();
    table.string('title', 512).notNullable();
    table.enum('status', ['ended', 'ongoing', 'scheduled']);
    table.date('start').notNullable();
    table.date('end').notNullable();
    table.double('expenses').notNullable();
    table.double('gross_income').notNullable();
    table.text('description', 'longtext').notNullable();
  });

  export const transparency = internal.createTable('transparency', (table) => {
    table.increments('id').primary().unique();
    table.integer('year').notNullable();
    table.double('expenses').notNullable();
    table.double('gross_income').notNullable();
    table.integer('sheltered_animals').notNullable();
    table.integer('adopted_animals').notNullable();
    table.integer('rescued_animals').notNullable();
    table.integer('under_custody_animals').notNullable();
  });
}

export default internal;
