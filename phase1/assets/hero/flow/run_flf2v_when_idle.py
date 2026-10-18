# -*- coding: utf-8 -*-
# Ждёт, пока очередь ComfyUI будет пуста 120 с подряд, затем считает FLF2V-пролёт стекло -> офис.
import time, json, urllib.request, subprocess, os, sys
HOST='http://127.0.0.1:8188'
def busy():
    try:
        q=json.load(urllib.request.urlopen(HOST+'/queue', timeout=5))
        return len(q.get('queue_running',[]))+len(q.get('queue_pending',[]))
    except Exception: return -1
idle=0
log=open(r'C:\projects\LTCG\phase1\assets\hero\flow\flf2v_log.txt','a',encoding='utf-8')
log.write(time.strftime('%H:%M:%S')+' waiting for idle queue\n'); log.flush()
while idle<120:
    b=busy()
    idle = idle+10 if b==0 else 0
    time.sleep(10)
log.write(time.strftime('%H:%M:%S')+' queue idle, starting morph\n'); log.flush()
os.chdir(r'D:\ComfyUI_windows_portable\STUDIO')
cmd=[r'..\python_embeded\python.exe','studio.py','morph','--image','flf_first.png','--image2','flf_last.png',
     '--width','1024','--height','576','--length','81','--fps','16','--frames-out','--out','office-flf2v',
     '--prompt','Slow, steady cinematic camera pull-back inside a quiet consulting office at sunset: from a close view of a frosted glass partition with a golden sign to the wide view of the whole office with a pale-oak desk, a switched-off monitor facing the camera, a chair with a jacket, a cup and a plant by the tall windows on the left. Static scene, nothing moves except the camera, warm low sun from the left, no people, no flicker.']
t0=time.time()
r=subprocess.run(cmd,capture_output=True,text=True,encoding='utf-8',errors='replace')
log.write(time.strftime('%H:%M:%S')+' morph finished rc=%s in %.0f s\n'%(r.returncode,time.time()-t0)); log.write((r.stdout or '')[-3000:]+'\n'+(r.stderr or '')[-2000:]+'\n'); log.flush()
