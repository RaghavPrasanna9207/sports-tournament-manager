"""Inspect all table schemas in the Oracle database."""
import db_config

def inspect():
    conn = db_config.get_db_connection()
    cursor = conn.cursor()
    
    # Get all user tables
    cursor.execute("SELECT table_name FROM user_tables ORDER BY table_name")
    tables = [row[0] for row in cursor.fetchall()]
    print(f"Tables found: {tables}\n")
    
    for t in tables:
        cursor.execute(
            f"SELECT column_name, data_type, data_length, nullable FROM user_tab_columns WHERE table_name = '{t}' ORDER BY column_id"
        )
        cols = cursor.fetchall()
        print(f"=== {t} ===")
        for col in cols:
            print(f"  {col[0]:30s} {col[1]:15s} len={col[2]}  nullable={col[3]}")
        print()
    
    conn.close()

if __name__ == '__main__':
    inspect()
