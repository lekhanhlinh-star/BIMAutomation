import logging
from sqlalchemy import text
from sqlalchemy.dialects import sqlite
from sqlalchemy.ext.asyncio import AsyncConnection

from app.db.base import Base

logger = logging.getLogger(__name__)


async def apply_sqlite_migrations(conn: AsyncConnection) -> None:
    """
    Generic dynamic SQLite schema synchronizer:
    Compares every SQLAlchemy model table in Base.metadata with actual SQLite table PRAGMA,
    and automatically executes ALTER TABLE ADD COLUMN for any newly added or missing columns.
    """
    sqlite_dialect = sqlite.dialect()

    for table_name, table in Base.metadata.tables.items():
        try:
            res = await conn.execute(text(f"PRAGMA table_info('{table_name}');"))
            existing_columns = {row[1] for row in res.fetchall()}

            if not existing_columns:
                continue  # Table doesn't exist yet, Base.metadata.create_all handles creation

            for column in table.columns:
                if column.name not in existing_columns:
                    col_type_str = column.type.compile(dialect=sqlite_dialect)
                    
                    # SQLite rules for ALTER TABLE ADD COLUMN:
                    # NOT NULL constraint must have a DEFAULT value
                    default_clause = ""
                    if not column.nullable:
                        if column.default is not None and getattr(column.default, 'arg', None) is not None:
                            val = column.default.arg
                            if isinstance(val, (int, float, bool)):
                                default_clause = f" DEFAULT {int(val) if isinstance(val, bool) else val}"
                            elif isinstance(val, str):
                                default_clause = f" DEFAULT '{val}'"
                        elif "BOOLEAN" in col_type_str.upper() or "INT" in col_type_str.upper():
                            default_clause = " DEFAULT 0"
                        elif "JSON" in col_type_str.upper():
                            default_clause = " DEFAULT '[]'"
                        elif "VARCHAR" in col_type_str.upper() or "TEXT" in col_type_str.upper():
                            default_clause = " DEFAULT ''"

                    sql = f"ALTER TABLE {table_name} ADD COLUMN {column.name} {col_type_str}{default_clause};"
                    logger.info(f"Auto-migrating SQLite: {sql}")
                    await conn.execute(text(sql))

        except Exception as e:
            logger.warning(f"Auto-migration check for table '{table_name}' encountered: {e}")
