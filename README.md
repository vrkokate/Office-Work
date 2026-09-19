<!DOCTYPE html>
<html lang="mr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>माझे ॲप</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            -webkit-tap-highlight-color: transparent;
        }

        body {
            background-color: #f4f6f9;
            color: #333;
            display: flex;
            flex-direction: column;
            height: 100vh;
        }

        /* ॲप हेडर */
        header {
            background-color: #007bff;
            color: white;
            text-align: center;
            padding: 16px;
            font-size: 1.2rem;
            font-weight: 600;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        /* वरचे ५ बॉक्स */
        .top-box-row {
            display: flex;
            gap: 10px;
            padding: 12px;
            background-color: #ffffff;
            border-bottom: 1px solid #e0e0e0;
            overflow-x: auto;
            white-space: nowrap;
            -webkit-overflow-scrolling: touch;
        }

        .top-box-row::-webkit-scrollbar {
            display: none;
        }

        .action-box {
            flex: 0 0 calc(20% - 8px);
            min-width: 68px;
            background-color: #f8f9fa;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 10px 4px;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }

        .action-box i {
            font-size: 1.2rem;
            color: #007bff;
            margin-bottom: 5px;
        }

        .action-box span {
            font-size: 0.72rem;
            color: #444;
            font-weight: 500;
        }

        .action-box:active {
            background-color: #e7f1ff;
            border-color: #007bff;
        }

        /* मुख्य कंटेंट */
        main {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            display: flex;
            justify-content: center;
            align-items: center;
            text-align: center;
        }

        .tab-content {
            display: none;
            animation: fadeIn 0.3s ease-in-out;
        }

        .tab-content.active {
            display: block;
        }

        .tab-content h2 {
            margin-bottom: 10px;
            color: #007bff;
        }

        /* तळाचा नॅव्हिगेशन बार */
        nav.bottom-nav {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 65px;
            background-color: #ffffff;
            display: flex;
            justify-content: space-around;
            align-items: center;
            box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.08);
            border-top: 1px solid #e0e0e0;
        }

        .nav-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-decoration: none;
            color: #888888;
            font-size: 0.75rem;
            flex: 1;
            height: 100%;
            cursor: pointer;
            transition: color 0.2s ease;
        }

        .nav-item i {
            font-size: 1.3rem;
            margin-bottom: 4px;
        }

        .nav-item.active {
            color: #007bff;
            font-weight: bold;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(5px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>
<body>

    <header id="page-title">मुखपृष्ठ</header>

    <!-- वरचे ५ बॉक्स (आता हे कायम सर्वांना दिसतील) -->
    <div class="top-box-row">
        <div class="action-box" onclick="alert('बॉक्स १')">
            <i class="fa-solid fa-id-card"></i>
            <span>माहिती</span>
        </div>
        <div class="action-box" onclick="alert('बॉक्स २')">
            <i class="fa-solid fa-gear"></i>
            <span>सेटिंग</span>
        </div>
        <div class="action-box" onclick="alert('बॉक्स ३')">
            <i class="fa-solid fa-wallet"></i>
            <span>खाते</span>
        </div>
        <div class="action-box" onclick="alert('बॉक्स ४')">
            <i class="fa-solid fa-clock-rotate-left"></i>
            <span>इतिहास</span>
        </div>
        <div class="action-box" onclick="alert('बॉक्स ५')">
            <i class="fa-solid fa-circle-question"></i>
            <span>मदत</span>
        </div>
    </div>

    <main>
        <section id="home" class="tab-content active">
            <h2>मुखपृष्ठ</h2>
            <p>हे ॲपचे मुख्य पान (Home Screen) आहे.</p>
        </section>

        <section id="search" class="tab-content">
            <h2>शोध</h2>
            <p>येथे तुम्ही माहिती शोधू शकता.</p>
        </section>

        <section id="orders" class="tab-content">
            <h2>ऑर्डर्स / कार्य</h2>
            <p>तुमच्या सर्व नोंदी किंवा ऑर्डर्स येथे दिसतील.</p>
        </section>

        <section id="notifications" class="tab-content">
            <h2>सूचना</h2>
            <p>सर्व महत्त्वाच्या अपडेट्स आणि नोटिफिकेशन्स येथे येतील.</p>
        </section>

        <section id="profile" class="tab-content">
            <h2>प्रोफाइल</h2>
            <p>वापरकर्त्याची माहिती आणि सेटिंग्ज येथे बदला.</p>
        </section>
    </main>

    <nav class="bottom-nav">
        <div class="nav-item active" onclick="switchTab('home', 'मुखपृष्ठ', this)">
            <i class="fa-solid fa-house"></i>
            <span>मुखपृष्ठ</span>
        </div>
        <div class="nav-item" onclick="switchTab('search', 'शोध', this)">
            <i class="fa-solid fa-magnifying-glass"></i>
            <span>शोध</span>
        </div>
        <div class="nav-item" onclick="switchTab('orders', 'ऑर्डर्स', this)">
            <i class="fa-solid fa-bag-shopping"></i>
            <span>ऑर्डर्स</span>
        </div>
        <div class="nav-item" onclick="switchTab('notifications', 'सूचना', this)">
            <i class="fa-solid fa-bell"></i>
            <span>सूचना</span>
        </div>
        <div class="nav-item" onclick="switchTab('profile', 'प्रोफाइल', this)">
            <i class="fa-solid fa-user"></i>
            <span>प्रोफाइल</span>
        </div>
    </nav>

    <script>
        function switchTab(tabId, title, element) {
            const contents = document.querySelectorAll('.tab-content');
            contents.forEach(content => content.classList.remove('active'));

            const navItems = document.querySelectorAll('.nav-item');
            navItems.forEach(item => item.classList.remove('active'));

            document.getElementById(tabId).classList.add('active');
            element.classList.add('active');

            document.getElementById('page-title').innerText = title;
        }
    </script>
</body>
</html>
