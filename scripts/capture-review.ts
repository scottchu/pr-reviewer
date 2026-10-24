import { chromium } from '@playwright/test';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
// Controlled real-browser evidence, not the user's personal browser session.
// The fresh browser opens the single-owner workspace without credentials.
const root=process.env.REVIEW_DATA_DIR, output=process.env.REVIEW_CAPTURE_DIR;
if(!root||!output)throw new Error('REVIEW_DATA_DIR and unique REVIEW_CAPTURE_DIR required');
const runtime=JSON.parse(readFileSync(join(root,'runtime.json'),'utf8')) as {uiUrl:string;gatewayUrl:string;reviewId:string;sourceCommit:string;sourceDirty:boolean};
mkdirSync(output,{recursive:true,mode:0o700});
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
try {
 const page=await browser.newPage({viewport:{width:1600,height:1200}});
 const targetUrl=new URL(runtime.uiUrl);targetUrl.searchParams.set("reviewId",runtime.reviewId);
 await page.goto(targetUrl.toString());
 await page.locator('.react-flow__node').first().waitFor();
 const response=await fetch(`${runtime.gatewayUrl}/api/reviews/${encodeURIComponent(runtime.reviewId)}`);
 if(!response.ok)throw new Error(`authorized query ${response.status}`);
 const review=await response.json() as {snapshot:{snapshotId:string;prUrl:string;baseSha:string;headSha:string}};
 writeFileSync(join(output,'identity.json'),JSON.stringify({candidate:{sourceCommit:runtime.sourceCommit,dirty:runtime.sourceDirty,worktree:resolve('.')},target:{reviewId:runtime.reviewId,...Object.fromEntries(Object.entries(review.snapshot).filter(([key])=>['snapshotId','prUrl','baseSha','headSha'].includes(key)))}},null,2));
 if(process.env.REVIEW_CAPTURE_FOCUS)await page.getByRole('button',{name:`Focus ${process.env.REVIEW_CAPTURE_FOCUS}`,exact:true}).click();
 const path=process.env.REVIEW_CAPTURE_PATH;
 if(path){
  await page.getByRole('button',{name:`Focus ${path}`,exact:true}).click();
  await page.getByRole('button',{name:`Open ${process.env.REVIEW_CAPTURE_SIDE??'head'} ${path}`,exact:true}).click();
  const start=process.env.REVIEW_CAPTURE_START??'1',end=process.env.REVIEW_CAPTURE_END??start;
  await page.getByLabel('Start line').fill(start);await page.getByLabel('End line').fill(end);
  await page.locator(`#source-${process.env.REVIEW_CAPTURE_SIDE??'head'}-${start}`).scrollIntoViewIfNeeded();
  await page.locator('.source-identity').screenshot({path:join(output,'source-identity.png')});
  await page.locator('.source-grid').screenshot({path:join(output,'source.png')});
  writeFileSync(join(output,'source.aria.txt'),await page.locator('.source-grid').ariaSnapshot());
 }else{
  if(process.env.REVIEW_CAPTURE_CONTEXT==='1')await page.getByRole('checkbox',{name:'Show referenced context'}).check();
  if(process.env.REVIEW_CAPTURE_SPANS==='1')await page.getByRole('checkbox',{name:'Show selected file’s changed spans'}).check();
  if(process.env.REVIEW_CAPTURE_UNRESOLVED==='1')await page.getByText(/Unresolved references and changed-path dispositions/).click();
  await page.locator('.review-graph').screenshot({path:join(output,'graph.png')});
  writeFileSync(join(output,'graph.aria.txt'),await page.locator('.review-graph').ariaSnapshot());
 }
 console.log(JSON.stringify({output,kind:path?'source':'graph',...{reviewId:runtime.reviewId,snapshotId:review.snapshot.snapshotId}}));
}finally{await browser.close();}
