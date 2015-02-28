# Bonza Framework

Bonza Framework is designed for building flexible, maintainable, fast and reliable web applications. 

Web applications are built from components called _applets_. Each applet can be used to create a number of instances; each instance is associated with an element on the web page and holds some state information. The applet determines how this information is reflected in the element's content and behavior.

An application normally consists of an HTML page containing placeholders for applet instances and an XML file with the applet library. To start using the library, `loadBonzaLibrary` function (the Bonza loader) needs to be called. From this point, the web page becomes 'alive': the placeholders are replaced with the corresponding applets' content and begin to react on events according to the applet definitions. The content of each applet instance can contain placeholders for new applet instances, and the process repeats.

Applet libraries are defined using an XML-based declarative language.

Every applet definition has a well-defined structure, consisting of the following parts: state, content, initialization, response and optional output, events and input sections. An applet has distinct MVC architecture, where state is Model, content is View and Controller is divided into several parts. 

Applets can communicate by broadcasting messages (output) and subscribing to other applets' output.

The Bonza language has advanced static type system that distinguishes integers, floats, date/time, intervals, strings, arrays, objects, actions, functions and dynamic data. User-defined types can also be created.
