const { DataSource } = require('typeorm');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const ds = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'lending_db',
});

async function checkUsers() {
  try {
    await ds.initialize();
    console.log('Connected to database...\n');

    const users = await ds.query(
      'SELECT id, email, name, roles, "isActive", "createdAt" FROM "user" ORDER BY "createdAt" DESC LIMIT 20'
    );

    console.log(`Total users found: ${users.length}\n`);

    if (users.length > 0) {
      console.log('Users in database:');
      console.log('─'.repeat(80));
      users.forEach((u, i) => {
        const roles = Array.isArray(u.roles) ? u.roles.join(', ') : u.roles || 'N/A';
        console.log(`${i + 1}. ${u.email}`);
        console.log(`   Name: ${u.name || 'N/A'}`);
        console.log(`   Roles: ${roles}`);
        console.log(`   Active: ${u.isActive ? 'Yes' : 'No'}`);
        console.log(`   Created: ${u.createdAt ? new Date(u.createdAt).toLocaleString() : 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('No users found in database.');
      console.log('\nTo seed default users, you can:');
      console.log('1. Call the API endpoint: POST http://localhost:3000/api/auth/seed');
      console.log('2. Or use curl: curl -X POST http://localhost:3000/api/auth/seed');
      console.log('\nDefault users that will be created:');
      console.log('- admin@urutilending.com / admin123');
      console.log('- loan.officer@urutilending.com / officer123');
      console.log('- manager@urutilending.com / manager123');
      console.log('- approver@urutilending.com / approver123');
      console.log('- user@urutilending.com / user123');
    }

    await ds.destroy();
  } catch (error) {
    console.error('Error checking users:', error.message);
    if (error.message.includes('does not exist')) {
      console.log('\nThe "user" table does not exist yet.');
      console.log('Make sure the database migrations have been run or synchronize is enabled.');
    }
    process.exit(1);
  }
}

checkUsers();

