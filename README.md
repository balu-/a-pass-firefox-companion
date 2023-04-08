# a-pass-firefox-companion
a-pass firefox compenion extension

Alpha version,
I'm not sure if this architecture is a good approach:
The extension intercepts urls like addon.a-pass.de/#url=<url>&<key-value>
and redirects them to <url> + tries to prefill user & password fileds from key-value
