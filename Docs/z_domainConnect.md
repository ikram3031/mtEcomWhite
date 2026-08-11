ডোমেইন কানেক্ট করা থেকে শুরু করে VPS-এ Nginx দিয়ে রিভার্স প্রক্সি কনফিগার করার পুরো প্রসেসটির একটি সুন্দর ও গোছানো Markdown (`README.md`) ফাইল নিচে দেওয়া হলো। আপনি চাইলে এটি কপি করে আপনার প্রজেক্টে `DOMAIN-SETUP.md` বা `README.md` নামে সেভ করে রাখতে পারেন:

````markdown
# VPS-এ ডোমেইন কানেক্ট এবং Nginx রিভার্স প্রক্সি গাইড

এই গাইডে দেখানো হয়েছে কীভাবে একটি ডোমেইন (যেমন: `decantrebd.com`) DNS ম্যানেজমেন্টের মাধ্যমে VPS-এর আইপি ঠিকানায় পয়েন্ট করতে হয় এবং Nginx ব্যবহার করে ডোমেইনটিকে ডকার কন্টেইনারের নির্দিষ্ট পোর্টের (যেমন: ফ্রন্টএন্ড পোর্ট ৮০০১) সাথে যুক্ত করতে হয়।

---

## ধাপ ১: DNS প্যানেলে ডোমেইন পয়েন্ট করা (A Record Setup)

আপনার ডোমেইনের রেজিস্ট্রার বা DNS প্যানেলে (যেমন: Hostinger, Cloudflare ইত্যাদি) গিয়ে দুটি প্রধান **A Record** অ্যাড করতে হবে:

1. **Root Domain-এর জন্য:**
   - **Type:** `A`
   - **Name / Host:** `@` (অথবা আপনার মূল ডোমেইন নাম যেমন: `decantrebd.com`)
   - **Points to / Value:** আপনার VPS-এর আইপি ঠিকানা (যেমন: `144.79.218.126`)
   - **TTL:** Default / Auto

2. **WWW সাবডোমেইনের জন্য:**
   - **Type:** `A`
   - **Name / Host:** `www`
   - **Points to / Value:** আপনার VPS-এর আইপি ঠিকানা (যেমন: `144.79.218.126`)
   - **TTL:** Default / Auto

---

## ধাপ ২: VPS-এ Nginx ইনস্টল করা

আপনার VPS-এ প্রবেশ করে Nginx ওয়েব সার্ভার ইনস্টল করুন (যদি আগে থেকে করা না থাকে):

```bash
sudo apt update
sudo apt install nginx
```
````

---

## ধাপ ৩: Nginx কনফিগারেশন ফাইল তৈরি করা

ডোমেইনের ট্রাফিক রিসিভ করার জন্য Nginx-এর `sites-available` ফোল্ডারে একটি নতুন কনফিগারেশন ফাইল তৈরি করুন:

```bash
sudo nano /etc/nginx/sites-available/decantrebd.com

```

ফাইলের ভেতরে নিচের ব্লকটি পেস্ট করুন (আপনার ডোমেইন নাম এবং পোর্টের সাথে মিলিয়ে নিন):

```nginx
server {
    listen 80;
    server_name decantrebd.com [www.decantrebd.com](https://www.decantrebd.com);

    location / {
        proxy_pass http://localhost:8001; # আপনার ডকার ফ্রন্টএন্ড পোর্ট
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

```

_(সেভ করতে প্রেস করুন: `Ctrl + O`, তারপর `Enter`, এবং বের হতে প্রেস করুন: `Ctrl + X`)_

---

## ধাপ ৪: সাইট এনাবল করা এবং Nginx রিস্টার্ট করা

তৈরি করা কনফিগারেশনটি `sites-enabled` ফোল্ডারে লিংক করুন এবং Nginx টেস্ট করে রিস্টার্ট করুন:

```bash
sudo ln -s /etc/nginx/sites-available/decantrebd.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

```

---

## ধাপ ৫: ফ্রি SSL সার্টিফিকেট (HTTPS) সেটআপ করা (Let's Encrypt / Certbot)

সাইটটিকে সিকিউর (HTTPS) করার জন্য Certbot ইনস্টল করে ফ্রি SSL সার্টিফিকেট কনফিগার করুন:

1. **Certbot ইনস্টল করুন:**

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx

```

2. **SSL সার্টিফিকেট জেনারেট করুন:**

```bash
sudo certbot --nginx -d decantrebd.com -d [www.decantrebd.com](https://www.decantrebd.com)

```

- প্রম্পট আসলে আপনার ইমেইল দিন, টার্মসে রাজি হতে `Y` প্রেস করুন এবং ট্রাফিক রিডাইরেক্ট করতে চাইলে অপشن `2` সিলেক্ট করুন।

---

## সফলভাবে সম্পন্ন!

এখন ব্রাউজারে সরাসরি `https://decantrebd.com` লিখে ভিজিট করলেই আপনার VPS-এর ডকার কন্টেইনারে চলা ফ্রন্টএন্ড অ্যাপটি লাইভ দেখতে পাবেন।

```

```
