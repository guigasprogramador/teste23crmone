// lib/mysql/config.ts
export const mysqlConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'your_database_name',
  port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT, 10) : 3306,
};

// Example for creating a connection string if needed by some libraries
export const getMysqlConnectionString = (): string => {
  const { host, user, password, database, port } = mysqlConfig;
  // Ensure password is uri encoded if it contains special characters
  const encodedPassword = encodeURIComponent(password);
  return `mysql://${user}:${encodedPassword}@${host}:${port}/${database}`;
};
