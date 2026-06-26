"use strict";(()=>{var e={};e.id=433,e.ids=[433],e.modules={2934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},852:e=>{e.exports=require("async_hooks")},6113:e=>{e.exports=require("crypto")},2254:e=>{e.exports=require("node:buffer")},6005:e=>{e.exports=require("node:crypto")},4492:e=>{e.exports=require("node:stream")},7261:e=>{e.exports=require("node:util")},2781:e=>{e.exports=require("stream")},3837:e=>{e.exports=require("util")},3116:(e,o,r)=>{r.r(o),r.d(o,{originalPathname:()=>A,patchFetch:()=>C,requestAsyncStorage:()=>y,routeModule:()=>f,serverHooks:()=>w,staticGenerationAsyncStorage:()=>E});var t={};r.r(t),r.d(t,{POST:()=>h});var a=r(3036),i=r(5736),n=r(5262),s=r(942),l=r(1309),p=r(9693),c=r(7864),d=r(3714);let u=[{pattern:/^(TBA|AMZN|1Z[0-9A-Z]{16}|[0-9]{12,14})/i,retailer:{name:"Amazon",logo:"\uD83D\uDCE6",color:"#FF9900"}},{pattern:/^[A-Z]{2}[0-9]{9}GB$/i,retailer:{name:"Royal Mail",logo:"✉️",color:"#E11B22"}},{pattern:/^(15|16|05|%5B)[0-9]{14,16}$/,retailer:{name:"DPD",logo:"\uD83D\uDE90",color:"#DC0032"}},{pattern:/^[A-Z0-9]{16}$/,retailer:{name:"Evri",logo:"\uD83D\uDCEC",color:"#8B2BE2"}},{pattern:/^(JD|1Z|GM|LX)[0-9A-Z]{14,}/i,retailer:{name:"DHL",logo:"\uD83D\uDFE1",color:"#FFCC00"}},{pattern:/^[0-9]{12,22}$/,retailer:{name:"FedEx",logo:"\uD83D\uDFE3",color:"#4D148C"}},{pattern:/^1Z[A-Z0-9]{16}$/i,retailer:{name:"UPS",logo:"\uD83D\uDFE4",color:"#351C15"}},{pattern:/^(AS|ASOS)[0-9A-Z]{8,}/i,retailer:{name:"ASOS",logo:"\uD83D\uDC57",color:"#2D2D2D"}}],g={amazon:{name:"Amazon",logo:"\uD83D\uDCE6",color:"#FF9900"},asos:{name:"ASOS",logo:"\uD83D\uDC57",color:"#2D2D2D"},dpd:{name:"DPD",logo:"\uD83D\uDE90",color:"#DC0032"},evri:{name:"Evri",logo:"\uD83D\uDCEC",color:"#8B2BE2"},hermes:{name:"Evri",logo:"\uD83D\uDCEC",color:"#8B2BE2"},dhl:{name:"DHL",logo:"\uD83D\uDFE1",color:"#FFCC00"},fedex:{name:"FedEx",logo:"\uD83D\uDFE3",color:"#4D148C"},ups:{name:"UPS",logo:"\uD83D\uDFE4",color:"#351C15"},"royal mail":{name:"Royal Mail",logo:"✉️",color:"#E11B22"},shein:{name:"SHEIN",logo:"\uD83D\uDC5A",color:"#000000"},zara:{name:"Zara",logo:"\uD83D\uDECD️",color:"#1A1A1A"},ebay:{name:"eBay",logo:"\uD83D\uDD35",color:"#E53238"},aliexpress:{name:"AliExpress",logo:"\uD83D\uDFE0",color:"#FF6A00"},temu:{name:"Temu",logo:"\uD83D\uDED2",color:"#FF6600"},boohoo:{name:"Boohoo",logo:"\uD83D\uDC9C",color:"#6B21A8"},prettylittlething:{name:"PLT",logo:"\uD83D\uDC97",color:"#E91E8C"}};var m=r(7237),x=r(5582);let D=l.Ry({mailboxCode:l.Z_().min(3),trackingNumber:l.Z_().optional(),retailer:l.Z_().optional(),senderHint:l.Z_().optional(),origin:l.Z_().optional(),weight:l.Rx().positive().optional(),dimensions:l.Z_().optional(),description:l.Z_().optional(),photoUrl:l.Z_().url().optional()});async function h(e){try{let o=await (0,d.oT)();if("CUSTOMER"===o.role)return s.NextResponse.json({error:"Forbidden"},{status:403});let r=await e.json(),t=D.parse(r),a=await c.Z.user.findUnique({where:{mailboxCode:t.mailboxCode.toUpperCase()}});if(!a)return s.NextResponse.json({error:`No client found for mailbox code ${t.mailboxCode}`},{status:404});let i=t.retailer??function(e,o){if(o){let e=o.toLowerCase();for(let[o,r]of Object.entries(g))if(e.includes(o))return r}let r=e.trim().toUpperCase();for(let{pattern:e,retailer:o}of u)if(e.test(r))return o;return null}(t.trackingNumber??"",t.senderHint)?.name??"Unknown",n=await c.Z.package.create({data:{clientId:a.id,trackingNumber:t.trackingNumber,retailer:i,origin:t.origin,weight:t.weight,dimensions:t.dimensions,description:t.description,photoUrl:t.photoUrl,status:"RECEIVED"}}),l=await c.Z.package.count({where:{clientId:a.id,status:{in:["RECEIVED","AWAITING_CONSOLIDATION"]}}});await c.Z.notification.create({data:{clientId:a.id,packageId:n.id,type:"PACKAGE_RECEIVED",channel:"EMAIL",subject:`Package received from ${i}`,message:`Package #${n.id.slice(-6).toUpperCase()} from ${i} received at warehouse.`}});let p={clientName:a.name,retailer:i,mailboxCode:a.mailboxCode,totalWaiting:l};return Promise.allSettled([(0,m.a7)({to:a.email,packageId:n.id,photoUrl:t.photoUrl,...p}),a.phone?(0,x.zf)({phone:a.phone,...p}):Promise.resolve()]).catch(console.error),s.NextResponse.json({success:!0,package:{id:n.id,shortId:n.id.slice(-6).toUpperCase(),clientName:a.name,mailboxCode:a.mailboxCode,retailer:i,status:n.status,receivedAt:n.receivedAt,waitingCount:l}})}catch(e){if(e instanceof p.jm)return s.NextResponse.json({error:"Validation error",details:e.errors},{status:400});if(e instanceof Error&&"UNAUTHORIZED"===e.message)return s.NextResponse.json({error:"Unauthorized"},{status:401});return console.error("[intake] error:",e),s.NextResponse.json({error:"Internal server error"},{status:500})}}let f=new a.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/packages/intake/route",pathname:"/api/packages/intake",filename:"route",bundlePath:"app/api/packages/intake/route"},resolvedPagePath:"/Users/giftchuks/freight-consolidation/apps/web/app/api/packages/intake/route.ts",nextConfigOutput:"",userland:t}),{requestAsyncStorage:y,staticGenerationAsyncStorage:E,serverHooks:w}=f,A="/api/packages/intake/route";function C(){return(0,n.patchFetch)({serverHooks:w,staticGenerationAsyncStorage:E})}},3714:(e,o,r)=>{r.d(o,{Gg:()=>p,fT:()=>s,oT:()=>c});var t=r(851),a=r(6315),i=r(9362);let n=new TextEncoder().encode(process.env.JWT_SECRET);async function s(e){return new t.N({...e}).setProtectedHeader({alg:"HS256"}).setIssuedAt().setExpirationTime("7d").sign(n)}async function l(e){try{let{payload:o}=await (0,a._)(e,n);return o}catch{return null}}async function p(){let e=await (0,i.cookies)(),o=e.get("auth_token")?.value;return o?l(o):null}async function c(e){let o=await p();if(!o)throw Error("UNAUTHORIZED");if(e&&o.role!==e&&"ADMIN"!==o.role)throw Error("FORBIDDEN");return o}},7864:(e,o,r)=>{r.d(o,{Z:()=>a});let t=require("@prisma/client"),a=globalThis.prisma??new t.PrismaClient({log:["error"]})},7237:(e,o,r)=>{r.d(o,{a7:()=>i,xf:()=>n});let t=new(r(217)).R(process.env.RESEND_API_KEY),a=process.env.RESEND_FROM_EMAIL??"notifications@gbxpresscargo.com";async function i(e){let{to:o,clientName:r,retailer:i,packageId:n,photoUrl:s,totalWaiting:l,mailboxCode:p}=e;await t.emails.send({from:a,to:o,subject:`📦 Package received from ${i}`,html:`
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: #0B1F3A; padding: 20px 24px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">XPRESS CARGO Consolidation</h1>
        </div>
        <div style="background: #F8FAFC; padding: 24px; border: 1px solid #E2E8F0; border-top: none;">
          <p style="color: #374151; font-size: 16px;">Hi <strong>${r}</strong>,</p>
          <p style="color: #374151;">A new package has arrived at our warehouse for your mailbox <strong>${p}</strong>.</p>
          
          <div style="background: white; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0 0 8px; color: #64748B; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Package Details</p>
            <p style="margin: 4px 0; color: #0B1F3A; font-size: 15px;"><strong>From:</strong> ${i}</p>
            <p style="margin: 4px 0; color: #0B1F3A; font-size: 15px;"><strong>Package ID:</strong> #${n.slice(-6).toUpperCase()}</p>
            <p style="margin: 4px 0; color: #0B1F3A; font-size: 15px;"><strong>Waiting for you:</strong> ${l} package${l>1?"s":""}</p>
          </div>

          ${s?`<img src="${s}" alt="Package photo" style="width: 100%; border-radius: 8px; margin-bottom: 16px;" />`:""}

          <a href="http://localhost:3000/packages" 
             style="display: inline-block; background: #1A56DB; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
            View My Packages
          </a>
          
          <p style="color: #64748B; font-size: 13px; margin-top: 24px;">
            You're receiving this because you have a mailbox with us. No need to call — we'll notify you of every arrival.
          </p>
        </div>
      </div>
    `})}async function n(e){let{to:o,clientName:r,shipmentId:i,amountPaid:n,method:s,packageCount:l,destination:p}=e;await t.emails.send({from:a,to:o,subject:`✅ Payment received — your shipment is confirmed`,html:`
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: #0B1F3A; padding: 20px 24px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">XPRESS CARGO Consolidation</h1>
        </div>
        <div style="background: #F8FAFC; padding: 24px; border: 1px solid #E2E8F0; border-top: none;">
          <p style="color: #374151; font-size: 16px;">Hi <strong>${r}</strong>,</p>
          <p style="color: #374151;">We've received your payment and your consolidated shipment is now <strong>confirmed</strong>. Our team will begin packing your ${l} package${1===l?"":"s"} shortly.</p>

          <div style="background: white; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 4px 0; color: #0B1F3A; font-size: 15px;"><strong>Method:</strong> ${s}</p>
            <p style="margin: 4px 0; color: #0B1F3A; font-size: 15px;"><strong>Packages:</strong> ${l}</p>
            <p style="margin: 4px 0; color: #0B1F3A; font-size: 15px;"><strong>Destination:</strong> ${p}</p>
            <p style="margin: 8px 0 4px; color: #10B981; font-size: 24px; font-weight: 700;">\xa3${n.toFixed(2)} paid</p>
          </div>

          <a href="http://localhost:3000/shipments/${i}"
             style="display: inline-block; background: #1A56DB; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
            Track Shipment
          </a>

          <p style="color: #64748B; font-size: 13px; margin-top: 24px;">
            We'll notify you the moment your shipment is dispatched.
          </p>
        </div>
      </div>
    `})}},5582:(e,o,r)=>{function t(){let e=process.env.TWILIO_ACCOUNT_SID,o=process.env.TWILIO_AUTH_TOKEN,r=Buffer.from(`${e}:${o}`).toString("base64"),t=process.env.TWILIO_WHATSAPP_FROM;return{sendMessage:async function(o,a){let i=`https://api.twilio.com/2010-04-01/Accounts/${e}/Messages.json`,n=new URLSearchParams({From:t,To:`whatsapp:${o}`,Body:a}),s=await fetch(i,{method:"POST",headers:{Authorization:`Basic ${r}`,"Content-Type":"application/x-www-form-urlencoded"},body:n.toString()});if(!s.ok){let e=await s.json();throw Error(`Twilio error: ${JSON.stringify(e)}`)}}}}async function a(e){let{phone:o,clientName:r,retailer:a,mailboxCode:i,totalWaiting:n}=e,s=t(),l=`📦 *XPRESS CARGO — Package Received*

Hi ${r}! A package from *${a}* has just arrived for mailbox *${i}*.

You now have *${n}* package${n>1?"s":""} waiting.

View your manifest: http://localhost:3000/packages

_No need to call us — we'll keep you posted here._`;await s.sendMessage(o,l)}async function i(e){let{phone:o,clientName:r,shipmentId:a,amountPaid:i,packageCount:n}=e,s=t(),l=`✅ *XPRESS CARGO — Payment Confirmed*

Hi ${r}! We've received your payment of *\xa3${i.toFixed(2)}*.

Your shipment of *${n}* package${1===n?"":"s"} is confirmed and heading to packing.

Track it: http://localhost:3000/shipments/${a}`;await s.sendMessage(o,l)}r.d(o,{uO:()=>i,zf:()=>a})}};var o=require("../../../../webpack-runtime.js");o.C(e);var r=e=>o(o.s=e),t=o.X(0,[522,922,746,309,217],()=>r(3116));module.exports=t})();