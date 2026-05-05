i want to implement new feature in the application. i will import the orders csv file which is exprted from the Zerodha Kite application.( i have added sample order file in the data folder).
this csv contain the orders with Buy and Sell and also include the order id, time, symbol, exchange, quantity, avgprice, and order type. I want to import the orders from this csv file and create the trades in the application. and then save the trades in the firebase.

Please first understand the data format of the csv file and then implement the feature. And follow the coding standards and best practices. And also implement the feature in a way that it can be easily understood and maintained.

Create a button "Import Orders" in the trades page.

Once imported, display me the details in the form of list, where i can see the details of each trade, and i can edit it.

1.  If i click on edit button, it should open the trade form with the details of the trade.
2.  And then i can save the trade. If i save the trade, it should update the trade in the firebase. And should update the trade counter.
3.  And then i can go to the dashboard and see the updated trade count.

Before saveing to firebase it shold show me the cnoslidated list and validate the data.
and also show me the count of buy trades and sell trades. and also show me the total quantity of buy and sell trades. and also show me the total quantity of buy and sell trades and display the net capital invested.
