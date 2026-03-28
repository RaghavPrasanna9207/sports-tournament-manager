import db_config

def check_schema():
    conn = db_config.get_db_connection()
    cursor = conn.cursor()
    tables = ['TOURNAMENT', 'TEAM', 'PLAYER', 'VENUE', 'REFEREE', 'MATCH', 'SCORE', 'TOURNAMENT_REGISTRATION']
    
    for t in tables:
        cursor.execute(f"SELECT column_name, data_type FROM all_tab_columns WHERE table_name = '{t}' ORDER BY column_id")
        cols = cursor.fetchall()
        print(f"\nSchema for {t}:")
        for col in cols:
            print(f"  {col[0]} ({col[1]})")
            
    conn.close()

if __name__ == '__main__':
    check_schema()
