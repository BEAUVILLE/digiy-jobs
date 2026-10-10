'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const file=fs.readFileSync(require('node:path').join(__dirname,'gestion-jobs-v2.html'),'utf8');
const match=file.match(/function nextOfferStatus\(status\)\{return status==="active"\?"closed":"active"\}/);
assert.ok(match,'owner status must be derived by pure function');
const next=vm.runInNewContext(match[0]+'; nextOfferStatus');
test('owner toggles real offer status, regardless of city or title',()=>{
 assert.equal(next('active'),'closed');
 assert.equal(next('closed'),'active');
 assert.equal(next('draft'),'active');
});
test('owner UI carries true row status as escaped data instead of display text',()=>{
 assert.match(file,/data-current-status="'\+esc\(o\.status\)\+'/);
 assert.match(file,/nextOfferStatus\(card\.dataset\.currentStatus\)/);
 assert.doesNotMatch(file,/querySelector\("\.meta"\)\.textContent\.includes\("active"\)/);
 assert.match(file,/\.eq\("id",id\)\.eq\("workspace_slug",workspaceSlug\)/);
 assert.match(file,/DIGIY_OWNER_PHONE_MFA\.guard/);
});
