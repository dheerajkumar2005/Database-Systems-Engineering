import psycopg2
from tabulate import tabulate
import psycopg2 as pg
from psycopg2 import sql
from parse import *

class PGShell:
    def __init__(self, hostname, port, database, username, password) -> None:
        self.hostname = hostname
        self.port = port
        self.database = database
        self.username = username
        self.password = password
        self.conn, self.cursor = self.connectDB()
                  
    def __del__(self) -> None:
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()
            
    def connectDB(self):
        """
        Establish a connection to PostgreSQL and return
        (connection, cursor).
        """
        try:
            "TODO: Create database connection (conn) and cursor"
            conn = psycopg2.connect(host=self.hostname,port=self.port,database=self.database,user=self.username,password=self.password)
            cursor = conn.cursor()
            
            return conn, cursor
        except Exception as e:
            print(e)
            # return "he","he"
            
    
    def loadSchema(self, filename):
        """
        Load SQL schema from a file.
        """
        try:
            # TODO: Read file and execute SQL
            with open(filename,'r') as f:
                commands = f.read().split(';')
            for command in commands:
                if command.strip(): # Skip empty strings
                    self.cursor.execute(command)
            self.conn.commit()
        except Exception as e:
            self.conn.rollback()
            print(e)

    def getTables(self):
        try:
            # TODO: List of (non-system) tables from the PostgreSQL information schema
            self.cursor.execute("""SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' order by table_name""")
            result = self.cursor.fetchall()
            print(tabulate(result, headers=["tables"], tablefmt="grid"))
        except Exception as e:
            self.conn.rollback()
            print(e)

    def printForeignKeys(self):
        try:
           #TODO: List all foreign key dependencies Outputs pairs (r, s) where r references s

            self.cursor.execute("""SELECT distinct                              
                                    tc.table_name, 
                                    ccu.table_name AS foreign_table_name
                                FROM information_schema.table_constraints AS tc 
                                JOIN information_schema.key_column_usage AS kcu
                                    ON tc.constraint_name = kcu.constraint_name
                                    AND tc.table_schema = kcu.table_schema
                                JOIN information_schema.constraint_column_usage AS ccu
                                    ON ccu.constraint_name = tc.constraint_name
                                WHERE tc.constraint_type = 'FOREIGN KEY'
                                    AND tc.table_schema='public'
                                ORDER BY tc.table_name,ccu.table_name
                                """)
            result = self.cursor.fetchall()
            print(tabulate(result, headers=["r", "s"], tablefmt="grid"))
        except Exception as e:
            self.conn.rollback()
            print(e)

    def print_fk_toposort(self):
        try:
            #TODO: Print all tables in topological order using recursive SQL based on foreign key dependencies
            self.cursor.execute(            """

                        WITH RECURSIVE
                        edges AS (
                            SELECT distinct
                                tc.table_name AS src,
                                ccu.table_name AS tgt
                            FROM information_schema.table_constraints tc
                            JOIN information_schema.constraint_column_usage ccu
                            ON tc.constraint_name = ccu.constraint_name
                            AND tc.table_schema = ccu.table_schema
                            WHERE tc.constraint_type = 'FOREIGN KEY'
                            AND tc.table_schema = 'public'
                        ),

                        nodes AS (
                            SELECT table_name
                            FROM information_schema.tables
                            WHERE table_schema = 'public'
                            AND table_type = 'BASE TABLE'
                        ),

                        depths AS (
                            -- base case: tables with no outgoing FK edges
                            SELECT
                                n.table_name,
                                0 AS depth
                            FROM nodes n
                            WHERE NOT EXISTS (
                                SELECT 1
                                FROM edges e
                                WHERE e.src = n.table_name
                            )

                            UNION ALL

                            -- recursive case: propagate depth forward
                            SELECT
                                e.src AS table_name,
                                d.depth + 1 AS depth
                            FROM depths d
                            JOIN edges e
                            ON e.tgt = d.table_name
                        )

                        SELECT
                            table_name,
                            MAX(depth) AS depth
                        FROM depths
                        GROUP BY table_name
                        ORDER BY depth ASC, table_name ASC;
            """)
            result = [[t[0]] for t in self.cursor.fetchall()]
            print(tabulate(result, headers=["tables"], tablefmt="grid"))
        except Exception as e:
            self.conn.rollback()
            print(e)

dbconn = None

# Command Parsing: DO NOT CHANGE ANYTHING BELOW THIS LINE
def parse_cmd(cmd):
    global dbconn
    cmd = str(cmd)

    if cmd.startswith("\\connect"):
        p = cmd.split()
        dbconn = PGShell(p[1], p[2], p[3], p[4], p[5])

    elif cmd.startswith("\\ddl"):
        dbconn.loadSchema(cmd.split()[1])

    elif cmd == "\\d":
        dbconn.getTables()

    elif cmd == "\\f":
        dbconn.printForeignKeys()

    elif cmd == "\\s":
        dbconn.print_fk_toposort()

    elif cmd == "\\q":
        exit()

    else:
        raise Exception("Invalid Command")


def main():
    while True:
        cmd = input("pgshell# ").strip()
        parse_cmd(cmd)

if __name__ == '__main__':
    main()