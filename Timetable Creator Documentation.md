# Timetable Creator Documentation

### About

The ***timetable creator*** is a software made to convinience students and lecturers in creating a timetable . Looks to make timetable creating easier , descriptively by accepting or combining .xml files of created files via *timetable creator* to make a whole complete timetable or just by allowing the user to manually create their timetable .

### How to use ?

![Image overview of time timetable creator software](./For%20Documentation//TimeTableOverviewImg.png)

This is what the timetable looks like upon initialisation

---
#### **Manual** Timetable Creation
---

To Start editing , you click on the empty grey spaces (or grey empty div) then add the text you want to have in them . For example "ISTN" as shown in the image below .

![Image of div text editing](./For%20Documentation//TextWriting.png)

In some cases you find that there are two modules in one time slot , fear not because timetable creator has a unique way of showing that . By adding  "**&&**"  the div will change color to indicate timetable clash then you can continue adding the second module text.

Here is an example :

![Image of module clash](./For%20Documentation//moduleClash.png)

Sometimes you can have a module that occupies **one timeslot** and sometimes there are **double lectures** (meaning more than one slot occupied) and for practicals up to almost **2 hours+ long** , you need more than just one slot , in that case you have the option to join multiple divs into one big div .
##### Steps to joining divs

**SELECT** divs you want to **join** by **(crtl + left Click) to select multiple** then after selecting **right click** to call join option .

![Image of proccess of joining divs](./For%20Documentation//JoinFunct.png)

Press join then 

![Image of resulting joined div ](./For%20Documentation//joinedDiv.png)

The two divs in timeslot 11:25 and 12:20 have been  joined in the above image.

---
#### Save Button

You can save the file as an .xml file , when saved as an .xml file it can later be loaded for editing once more .

---

#### Reset Button
The reset button , reset the whole timetable to its initial uneditted state .

---

#### print Button
The print button allows the user to export their timetable as a pdf file , which they can either keep as a pdf or print it .

![Image of export suitable preferences](./For%20Documentation//printFunct.png)

For proper print sizing , you adviced to set ***Pages*** to **Odd page only** .

**Some websites require more Settings , you may see the message : ***"Sorry , this feature is not available here"***.**

*To fix that Click on More settings after having pressed print button .*

*Have Paper Size -> A4*

*On Options check -> Background Graphics*

and everything should look well , no more error screen for you else if you are using a smaller screen like a phone screen then this feature hasn't been made available for smaller screens .

---

#### **Loading .xml files** Timetable Creation

---

When the **Load** button is pressed , it will open your file explorer and you have to navigate to the saved .xml file to load it .

And **YES** you can load multiple .xml files , when loading the timetable creator software will combine the files into one complete timetable . This is one of most cherished feature the timetable creator software offers .


That'll be it , ***A great day to you and good luck on your studies .***

---

#### **Additional Information**

1. **Change Color Themes**
  - You can change the color themes by clicking one either one of the circles on next to **LOAD**
  
2. **Keys**
  - Below the timetable are keys that indicate when a div is :
    - ***Has clashing modules***
    - ***Has a module*** ( there is lecture )
    - ***Has nothing*** ( free )