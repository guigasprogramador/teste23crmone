// lib/mysql/config.ts
export const mysqlConfig = {
  host: '127.0.0.1',
  user: 'root',
  password: '123456789',
  database: 'crmone-teste',
  port: 3306,
};

// Example for creating a connection string if needed by some libraries
export const getMysqlConnectionString = (): string => {
  const { host, user, password, database, port } = mysqlConfig;
  // Ensure password is uri encoded if it contains special characters
  const encodedPassword = encodeURIComponent(password);
  return `mysql://${user}:${encodedPassword}@${host}:${port}/${database}`;
};
