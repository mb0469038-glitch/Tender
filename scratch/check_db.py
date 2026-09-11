import sqlite3

conn = sqlite3.connect('workspace-data/legacy_sqlite_archive/tender-studio.sqlite')
cur = conn.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = [t[0] for t in cur.fetchall()]
print('Tables in SQLite:', tables)
for t in tables:
    try:
        cur.execute(f'SELECT count(*) FROM "{t}"')
        print(f'{t}: {cur.fetchone()[0]} rows')
    except Exception as e:
        print(f'{t}: error {e}')
