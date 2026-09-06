import json,sys,urllib.request
name=sys.argv[1];data=sys.argv[2].encode()
request=urllib.request.Request('http://127.0.0.1:18743/'+name,data=data,headers={'Content-Type':'application/json'})
with urllib.request.urlopen(request,timeout=40) as response:print(response.read().decode())
