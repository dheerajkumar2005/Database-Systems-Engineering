import sys

with open('universitySchema.sql','r') as f:
                lines = f.readlines()
                for l in lines:
                    print(l)