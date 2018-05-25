This folder and its subfolders are EXCLUDED from the Manual build process by default. Only certain subfolders are then copied over /img, which adds some language-specific images and overwrites other existing images.

/language: Should only contain LANGUAGE-SPECIFIC versions of images, like module icons with text.
	- The subfolder of the language being built will be copied on top of /img.
	- If the version being built is "localize", then all languages will be copied and available in img-lang-overrides/ so that they can be swapped between.