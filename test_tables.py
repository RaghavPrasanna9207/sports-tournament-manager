import db_config
import traceback

def test_tables():
    conn = db_config.get_db_connection()
    cursor = conn.cursor()
    tables = ['REFEREES', 'REGISTRATIONS', 'MATCHES', 'SCORES']
    
    for t in tables:
        try:
            cursor.execute(f"SELECT * FROM {t} FETCH FIRST 1 ROWS ONLY")
            columns = [col[0] for col in cursor.description]
            print(f"SUCCESS: {t} exists. Columns: {columns}")
        except Exception as e:
            print(f"FAILED on {t}:")
            traceback.print_exc()
            
    conn.close()

if __name__ == '__main__':
    test_tables()
