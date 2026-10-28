Admin Control Panel — मर्यादा व वापर

- Built-in demo credentials: admin/admin123, user/user123 (मूळ प्रकल्पानुसार).
- Admin dashboard मध्ये खाते/पासवर्ड बदल (localStorage), खाते active/inactive, प्रति-username tab visibility आणि login-session list जोडले.
- या सुविधांचा डेटा सध्याच्या browser origin च्या localStorage मध्येच राहतो; दुसऱ्या संगणकावर sync होत नाही.
- Client-side HTML/JS मध्ये admin role आणि password सुरक्षित ठेवता येत नाही. Production साठी backend API, server-side sessions, password hashing, authorization checks आणि database आवश्यक आहेत.
- मूळ business module files आणि त्यांच्या data keys जाणीवपूर्वक न बदलता ठेवले आहेत. प्रत्येक module च्या buttons/print flow ची browser-level regression test स्वतंत्रपणे करणे आवश्यक आहे.
