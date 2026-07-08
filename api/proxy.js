module.exports = async (req, res) => {
    const targetUrl = req.query.url;

    if (!targetUrl) {
        return res.status(400).send("Error: Missing target URL.");
    }

    try {
        // Vercel-এর বিল্ট-ইন গ্লোবাল fetch ব্যবহার করা হয়েছে, যা রিডাইরেক্ট অটো ফলো করে
        const response = await fetch(targetUrl, {
            method: 'GET',
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5"
            }
        });

        // যদি সাইটটি রেসপন্স না করে
        if (!response.ok && response.status !== 403 && response.status !== 404) {
            return res.status(response.status).send(`Target site returned error code: ${response.status}`);
        }

        let html = await response.text();
        const parsedUrl = new URL(targetUrl);
        const origin = parsedUrl.origin;

        // লিংক রিরাইটার (ভাঙা CSS/JS/Image পাথ ফিক্স করার জন্য)
        html = html.replace(/(src|href|action)="\/(?!\/)/g, `$1="${origin}/`);
        html = html.replace(/(src|href|action)=' \/(?!\/)/g, `$1='${origin}/`);

        // আইফ্রেম ব্লকিং সিকিউরিটি হেডারগুলো রিমুভ করা
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("X-Frame-Options", "ALLOWALL"); // কিছু ব্রাউজার সাপোর্ট ফিক্স

        return res.status(200).send(html);

    } catch (error) {
        // ক্র্যাশ না করে এররটা স্ক্রিনে দেখাবে
        return res.status(500).send(`Proxy Runtime Error: ${error.message}`);
    }
};
