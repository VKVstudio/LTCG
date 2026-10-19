import io,re,sys
p=r'C:\projects\LTCG\phase1\hero-slice.html'
s=io.open(p,encoding='utf-8').read()
m=re.search(r'data-v="([^"]+)"',s)
old=m.group(1)
n=int(re.sub(r'\D','',old)[-3:] or 0)
new='dev%03d'%((n+1)%1000)
s=s.replace(old,new).replace('?v=20260904f','?v='+new).replace('?v=dev','?v=dev')
s=re.sub(r'\?v=[A-Za-z0-9]+',  '?v='+new, s)
io.open(p,'w',encoding='utf-8').write(s)
print(old,'->',new)
