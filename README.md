# Gifgit Image Editor
Image editor with layers and selections like lasso and polygon. Full working demo can be found at:

https://www.gifgit.com

The editor is not built with any javascript framework or with any javascript canvas library. Each image editing tool is identified by a page, example the eraser tool is "eraser.html". 

The associated scripts for the edit pages are in the same folder as the pages so remove the extra URL path in the html file.
Example for eraser.html:

<script src="/scripts/tools/eraser.js"></script>
becomes:
<script src="eraser.js"></script>

