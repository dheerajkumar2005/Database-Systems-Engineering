from pyspark import SparkContext, SparkConf
import sys

conf = SparkConf().setAppName("Movie watching sessions")
sc = SparkContext(conf=conf)

lines = sc.textFile(sys.argv[1])

movie_lines = lines.map(lambda x: x.split(','))

def gen_pairs(line):
    pairs = []
    for m1 in line:
        for m2 in line:
            if (m1 < m2):
                pairs.append(((m1,m2),1))
    return pairs


movie_pairs = movie_lines.flatMap(gen_pairs)
movie_pairs_count = movie_pairs.reduceByKey(lambda a,b:a+b)

top_5 = movie_pairs_count.sortBy(lambda x: (-x[1], x[0][0], x[0][1])).take(5) # type: ignore

for (movie1, movie2), count in top_5:
    print(f"{movie1}, {movie2}, {count}")

sc.stop()


    
