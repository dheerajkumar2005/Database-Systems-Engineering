from pyspark.sql import SparkSession
from pyspark.sql.functions import *
from pyspark.sql.types import *
import sys
spark =  SparkSession.builder.appName("Fraud detection").getOrCreate()

df = spark.read.csv(sys.argv[1],header=True,inferSchema=True)
# df.printSchema()

### part-1

transactions_per_user = df.groupBy("user_id").count().alias("count")
max_transactions = transactions_per_user.agg({"count": "max"}).collect()[0][0]
top_users = transactions_per_user.filter(col("count") == max_transactions).orderBy(col("user_id")).limit(10)

for user in top_users.collect():
    print(user["user_id"])


## part 2

cities_per_user = df.groupBy("user_id").agg(count_distinct("city").alias("cities"))
failed_transactions_per_user = df.groupBy("user_id").agg(sum(when(col("status")== "FAILED",1).otherwise(0)).alias("failed_count"))

stats = transactions_per_user.join(cities_per_user, "user_id").join(failed_transactions_per_user, "user_id")
susp = stats.filter((col("count") > 5000)|(col("cities") > 10)|(col("failed_count") > 50))

susp = susp.orderBy("user_id").limit(10)
rows = susp.collect()

for row in rows:
    print(row["user_id"])

spark.stop()




