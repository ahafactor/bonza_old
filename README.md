# Bonza Framework

Bonza Framework is designed for building flexible, maintainable, fast and reliable web applications. 

Web applications are built from components called _applets_. Every applet can be used to create a number of instances; each instance is associated with an element on the web page and holds some state information. The applet determines how this information is reflected in the element's content and behavior.

An application normally consists of an HTML page containing placeholders for applet instances and an XML file with the applet library. To start using the library, function `loadBonzaLibrary` (the Bonza loader) needs to be called. From this point, the web page becomes 'alive': the placeholders are replaced with the corresponding applet instances' content and begin to react on events according to the applet definitions. The content of each applet instance is simply HTML code that can contain placeholders for new applet instances, and the process repeats. Therefore, no roundtrips to the server are generally needed to update the content of the page; any additional data can be obtained, for example, by using AJAX.

Applet placeholders are distinguished by using special class names, containing the applet names. The `id` attribute serves to associate each page element with a particular instance and therefore must be present and unique.

Applet libraries are defined using an XML-based declarative language.

Every applet definition has a well-defined structure, consisting of the following parts: state, content, initialization, response and optional output, events and input sections. An applet has a distinct MVC architecture, where state is Model, content is View and Controller is divided into several parts. 

Applets in a library can communicate by broadcasting messages (output) and subscribing to other applets' output.

The Bonza language has an advanced static type system that distinguishes integers, floats, date/time, intervals, strings, arrays, objects, actions, functions and dynamic data. User-defined types can also be created.

We have created a few examples of using Bonza. The simplest is [Calculator Demo](examples/calculator/index.html).
