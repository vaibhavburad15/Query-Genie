export type DatabaseSourceType =
  | 'mysql'
  | 'postgresql'
  | 'mariadb'
  | 'oracle'
  | 'sqlserver'
  | 'db2'
  | 'sqlite'
  | 'mongodb'
  | 'redis'
  | 'csv'
  | 'excel';

export type DatabaseSourceCategory = 'sql' | 'file' | 'nosql';

export interface DatabaseSourceDefinition {
  type: DatabaseSourceType;
  label: string;
  shortLabel: string;
  category: DatabaseSourceCategory;
  defaultPort?: string;
  databaseLabel: string;
  databasePlaceholder: string;
  supportsListing: boolean;
  supportsCreate: boolean;
  supportsChat: boolean;
  fileAccept?: string;
  helperText: string;
}

export const DATABASE_SOURCES: DatabaseSourceDefinition[] = [
  {
    type: 'mysql',
    label: 'MySQL',
    shortLabel: 'MySQL',
    category: 'sql',
    defaultPort: '3306',
    databaseLabel: 'Database',
    databasePlaceholder: 'my_database',
    supportsListing: true,
    supportsCreate: true,
    supportsChat: true,
    helperText: 'Connect to a MySQL server and browse available databases.',
  },
  {
    type: 'postgresql',
    label: 'PostgreSQL',
    shortLabel: 'Postgres',
    category: 'sql',
    defaultPort: '5432',
    databaseLabel: 'Database',
    databasePlaceholder: 'postgres',
    supportsListing: true,
    supportsCreate: true,
    supportsChat: true,
    helperText: 'Use your PostgreSQL server credentials or select from discovered databases.',
  },
  {
    type: 'mariadb',
    label: 'MariaDB',
    shortLabel: 'MariaDB',
    category: 'sql',
    defaultPort: '3306',
    databaseLabel: 'Database',
    databasePlaceholder: 'analytics',
    supportsListing: true,
    supportsCreate: true,
    supportsChat: true,
    helperText: 'MariaDB uses the same guided server flow as MySQL.',
  },
  {
    type: 'oracle',
    label: 'Oracle Database',
    shortLabel: 'Oracle',
    category: 'sql',
    defaultPort: '1521',
    databaseLabel: 'Service Name',
    databasePlaceholder: 'XEPDB1',
    supportsListing: false,
    supportsCreate: false,
    supportsChat: true,
    helperText: 'Enter the Oracle host, port, credentials, and service name directly.',
  },
  {
    type: 'sqlserver',
    label: 'Microsoft SQL Server',
    shortLabel: 'SQL Server',
    category: 'sql',
    defaultPort: '1433',
    databaseLabel: 'Database',
    databasePlaceholder: 'master',
    supportsListing: true,
    supportsCreate: false,
    supportsChat: true,
    helperText: 'Connect with SQL Server credentials and optionally pick from discovered databases.',
  },
  {
    type: 'db2',
    label: 'IBM Db2',
    shortLabel: 'Db2',
    category: 'sql',
    defaultPort: '50000',
    databaseLabel: 'Database',
    databasePlaceholder: 'sample',
    supportsListing: false,
    supportsCreate: false,
    supportsChat: true,
    helperText: 'Provide the Db2 host, port, credentials, and database name.',
  },
  {
    type: 'sqlite',
    label: 'SQLite',
    shortLabel: 'SQLite',
    category: 'sql',
    databaseLabel: 'SQLite File Path',
    databasePlaceholder: 'C:\\data\\app.db',
    supportsListing: false,
    supportsCreate: false,
    supportsChat: true,
    helperText: 'Point Query Genie at a local .db or .sqlite file.',
  },
  {
    type: 'csv',
    label: 'CSV',
    shortLabel: 'CSV',
    category: 'file',
    databaseLabel: 'CSV File',
    databasePlaceholder: 'Upload a CSV file',
    supportsListing: false,
    supportsCreate: false,
    supportsChat: true,
    fileAccept: '.csv,text/csv',
    helperText: 'Upload a CSV file and Query Genie will stage it as a temporary SQLite source.',
  },
  {
    type: 'excel',
    label: 'Excel',
    shortLabel: 'Excel',
    category: 'file',
    databaseLabel: 'Excel File',
    databasePlaceholder: 'Upload an Excel workbook',
    supportsListing: false,
    supportsCreate: false,
    supportsChat: true,
    fileAccept: '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    helperText: 'Upload an Excel workbook and each sheet becomes a queryable table.',
  },
  {
    type: 'mongodb',
    label: 'MongoDB',
    shortLabel: 'MongoDB',
    category: 'nosql',
    defaultPort: '27017',
    databaseLabel: 'Database',
    databasePlaceholder: 'admin',
    supportsListing: true,
    supportsCreate: false,
    supportsChat: false,
    helperText: 'Browse MongoDB databases and collections. Natural-language querying is metadata-only for now.',
  },
  {
    type: 'redis',
    label: 'Redis',
    shortLabel: 'Redis',
    category: 'nosql',
    defaultPort: '6379',
    databaseLabel: 'Database Index',
    databasePlaceholder: '0',
    supportsListing: false,
    supportsCreate: false,
    supportsChat: false,
    helperText: 'Connect to a Redis instance and inspect the active logical database.',
  },
];

const DATABASE_SOURCE_MAP = new Map(
  DATABASE_SOURCES.map((source) => [source.type, source])
);

export const DEFAULT_DATABASE_SOURCE = DATABASE_SOURCES[0];

export function getDatabaseSource(
  type?: string | null
): DatabaseSourceDefinition {
  if (!type) {
    return DEFAULT_DATABASE_SOURCE;
  }
  return DATABASE_SOURCE_MAP.get(type as DatabaseSourceType) ?? DEFAULT_DATABASE_SOURCE;
}
