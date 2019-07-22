# Gifgit Image Editor
Image editor with layers and selections like lasso and polygon. Full working demo can be found at:

https://www.gifgit.com

**Please Note:**

The editor is not built with any javascript framework or with any javascript canvas library. Each image editing tool is in a dedicated page, example the eraser tool is "eraser.html". 

The associated scripts for the edit tool page are in the same folder as the page so **remove the extra URL path** ("/scripts/tools/") in front of the script files.

Example for eraser.html at the bottom of the page:

<script src="/scripts/tools/eraser.js"></script>
change to:
<script src="eraser.js"></script>


*I built the pages with node express and didn't have the time to re-edit the files.*
