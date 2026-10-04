import psycopg2
import time
from rag import get_embedding

from config import PGDATABASE, PGUSER, PGPASSWORD, PGHOST

queries = [
   "Top 5 thriller movies",
   "Top 5 horror movies" ,
   "Sci-fi adventure in space with aliens",
   "Documentary about nature and wild animals",
   "Top 5 action movies"
]

embeddings = [get_embedding(q) for q in queries] # Caluclate embeddings for queries

def run_searches(conn, label, op):
    cur = conn.cursor()
    print(label)
    
    total_time = 0
    for i, emb in enumerate(embeddings):
        vec_str = '[' + ','.join(map(str, emb)) + ']'
        
        start = time.time()
        cur.execute(f"SELECT overview FROM imdb_staging ORDER BY embedding {op} %s::vector LIMIT 5;", (vec_str,))
        rows = cur.fetchall()
        duration = time.time() - start
        total_time += duration
        
        print(f"  Query {i+1} ('{queries[i]}') took: {duration:.4f} seconds")

    cur.close()
    return total_time / len(embeddings)

def main():
    conn = psycopg2.connect(dbname=PGDATABASE, user=PGUSER, password=PGPASSWORD, host=PGHOST, port = 5432)
    conn.autocommit = True
    
    cur = conn.cursor()
    
    # Dropping indexing if any, to test fresh from scratch
    cur.execute("SELECT indexname FROM pg_indexes WHERE tablename = 'imdb_staging' AND indexdef LIKE '%embedding%';")
    existing_indexes = cur.fetchall()
  
    for idx in existing_indexes:
        cur.execute(f"DROP INDEX IF EXISTS {idx[0]};")
        
    metrics = [
        {"name": "L2 (Euclidean)", "op": "<->", "index_op": "vector_l2_ops"},
        {"name": "Inner Product", "op": "<#>", "index_op": "vector_ip_ops"},
        {"name": "L1 (Manhattan)", "op": "<+>", "index_op": "vector_l1_ops"},
        {"name": "Cosine", "op": "<=>", "index_op": "vector_cosine_ops"}
    ]
    
    results = {}

    for m in metrics:
        metric_name = m["name"]
        op = m["op"]
        index_op = m["index_op"]
        
        # 1. No index
        avg_no_index = run_searches(conn, f"{metric_name} - No Index Search", op)
        
        # 2. HNSW index
        cur.execute("DROP INDEX IF EXISTS imdb_hnsw_idx;")
        cur.execute("DROP INDEX IF EXISTS imdb_ivfflat_idx;")

        try:
            start = time.time()
            cur.execute(f"CREATE INDEX imdb_hnsw_idx ON imdb_staging USING hnsw (embedding {index_op});")
            build_time = time.time() - start
            
            print(f"HNSW Index built in {build_time:.4f} seconds.")
            avg_hnsw = run_searches(conn, f"{metric_name} With HNSW Index", op)
        except Exception as e:
            avg_hnsw = 0.0
        
        # 3. IVFFlat index
        cur.execute("DROP INDEX IF EXISTS imdb_hnsw_idx;")
        
        if metric_name == "L1 (Manhattan)":
            # Not supported by IVFFlat in pgvector
            avg_ivfflat = 0.0
        else:
            try:
                start = time.time()
                cur.execute(f"CREATE INDEX imdb_ivfflat_idx ON imdb_staging USING ivfflat (embedding {index_op}) WITH (lists = 100);")
                build_time = time.time() - start
                print(f"IVFFlat Index built in {build_time:.4f} seconds.")
                
                avg_ivfflat = run_searches(conn, f"{metric_name} - With IVFFlat Index", op)
            except Exception as e:
                avg_ivfflat = 0.0
        
        cur.execute("DROP INDEX IF EXISTS imdb_ivfflat_idx;")
        
        results[metric_name] = {
            'No Index': avg_no_index,
            'HNSW': avg_hnsw,
            'IVFFlat': avg_ivfflat
        }

    cur.close()
    conn.close()

   
if __name__ == "__main__":
    main()