<!DOCTYPE html>
<html lang="mr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Digital Hub</title>
    <!-- आयकॉन्ससाठी Font Awesome -->
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
            background-color: #030a16;
            color: #ffffff;
            display: flex;
            flex-direction: column;
            height: 100vh;
            overflow: hidden;
        }

        /* ॲप हेडर */
        header {
            background-color: rgba(3, 10, 22, 0.95);
            backdrop-filter: blur(10px);
            color: white;
            text-align: center;
            padding: 14px;
            font-size: 1.15rem;
            font-weight: 700;
            border-bottom: 1px solid rgba(0, 195, 255, 0.2);
            z-index: 10;
        }

        /* मुख्य कंटेंट स्क्रीन */
        main {
            flex: 1;
            position: relative;
            overflow-y: auto;
        }

        .tab-content {
            display: none;
            height: 100%;
        }

        .tab-content.active {
            display: block;
        }

        /* होम पेज पोस्टर डिझाइन */
        .home-poster-container {
            position: relative;
            width: 100%;
            min-height: 100%;
            background-image: url('home-bg.jpg');
            background-size: cover;
            background-position: center top;
            background-repeat: no-repeat;
            display: flex;
            flex-direction: column;
        }

        /* फोटोवरील ५ बॉक्सेसवर अचूक बसणारी क्लिकेबल लेयर */
        .clickable-box-layer {
            position: absolute;
            top: 13.8%; /* फोटोतील ५ बॉक्सचे अचूक स्थान */
            left: 0;
            right: 0;
            display: flex;
            justify-content: space-evenly;
            padding: 0 10px;
            z-index: 5;
        }

        /* वैयक्तिक क्लिकेबल लिंक बॉक्स */
        .nav-tap-btn {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 18%;
            height: 52px;
            text-decoration: none;
            border-radius: 12px;
            transition: all 0.15s ease;
            background: transparent;
        }

        /* बटण दाबल्यावर ३D ग्लो इफेक्ट */
        .nav-tap-btn:active {
            transform: scale(0.92);
            background: rgba(255, 255, 255, 0.25);
            box-shadow: 0 0 15px rgba(255, 255, 255, 0.6);
        }

        /* इतर टॅब्ससाठी साधे पेज */
        .normal-page {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            text-align: center;
            padding: 20px;
            color: #d1d5db;
        }

        .normal-page h2 {
            color: #00d2ff;
            margin-bottom: 8px;
        }

        /* तळाचा ५ टॅबचा बॉटम बार */
        nav.bottom-nav {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 60px;
            background-color: rgba(6, 15, 30, 0.95);
            backdrop-filter: blur(8px);
            display: flex;
            justify-content: space-around;
            align-items: center;
            border-top: 1px solid rgba(0, 195, 255, 0.2);
            z-index: 10;
        }

        .nav-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: #8da2c0;
            font-size: 0.72rem;
            flex: 1;
            height: 100%;
            cursor: pointer;
            text-decoration: none;
            transition: color 0.2s ease;
        }

        .nav-item i {
            font-size: 1.25rem;
            margin-bottom: 3px;
        }

        .nav-item.active {
            color: #00d2ff;
            font-weight: 700;
            text-shadow: 0 0 10px rgba(0, 210, 255, 0.5);
        }
    </style>
</head>
<body>

    <!-- हेडर -->
    <header id="page-title">Digital Hub</header>

    <main>
        <!-- होम स्क्रीन (फोटो आणि लिंक्स) -->
        <section id="home" class="tab-content active">
            <div class="home-poster-container">
                <!-- फोटोतील ५ बॉक्सवर ठेवलेल्या ५ थेट लिंक्स -->
                <div class="clickable-box-layer">
                    <!-- १. Est. लिंक -->
                    <a href="https://google.com" target="_blank" class="nav-tap-btn" title="Est."></a>
                    
                    <!-- २. MB लिंक -->
                    <a href="https://google.com" target="_blank" class="nav-tap-btn" title="MB"></a>
                    
                    <!-- ३. Form लिंक -->
                    <a href="https://google.com" target="_blank" class="nav-tap-btn" title="Form"></a>
                    
                    <!-- ४. Tab-4 लिंक -->
                    <a href="https://google.com" target="_blank" class="nav-tap-btn" title="Tab-4"></a>
                    
                    <!-- ५. Tab-5 लिंक -->
                    <a href="https://google.com" target="_blank" class="nav-tap-btn" title="Tab-5"></a>
                </div>
            </div>
        </section>

        <!-- शोध टॅब -->
        <section id="search" class="tab-content">
            <div class="normal-page">
                <h2>शोध</h2>
                <p>येथे तुम्ही माहिती शोधू शकता.</p>
            </div>
        </section>

        <!-- ऑर्डर्स टॅब -->
        <section id="orders" class="tab-content">
            <div class="normal-page">
                <h2>ऑर्डर्स / कार्य</h2>
                <p>तुमच्या सर्व नोंदी आणि ऑर्डर्स येथे दिसतील.</p>
            </div>
        </section>

        <!-- सूचना टॅब -->
        <section id="notifications" class="tab-content">
            <div class="normal-page">
                <h2>सूचना</h2>
                <p>सर्व नवीन नोटिफिकेशन्स येथे येतील.</p>
            </div>
        </section>

        <!-- प्रोफाइल टॅब -->
        <section id="profile" class="tab-content">
            <div class="normal-page">
                <h2>प्रोफाइल</h2>
                <p>वापरकर्त्याची माहिती आणि सेटिंग्ज येथे बदला.</p>
            </div>
        </section>
    </main>

    <!-- तळाचा ५ टॅब असलेला नॅव्हिगेशन बार -->
    <nav class="bottom-nav">
        <div class="nav-item active" onclick="switchTab('home', 'Digital Hub', this)">
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

    <!-- टॅब बदलण्यासाठी स्क्रिप्ट -->
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
