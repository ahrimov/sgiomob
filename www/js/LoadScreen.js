class LoadScreen{
    constructor(amount, message = ''){
        this.counter = 0
        this.amount = amount
        this.message = message
    }

    startLoad(){
        document.querySelector('#myNavigator').pushPage('./views/loadScreen.html');
    }

    elementLoaded(){
        this.counter++;
        document.querySelector('#load_stage').textContent = `${this.counter}/${this.amount}`;
        if(this.counter >= this.amount){
            this.finishLoad()
        }
    }

    finishLoad(){
        setTimeout(() => {document.querySelector('#myNavigator').popPage()}, 300) 
        if(this.message != ''){
            ons.notification.alert({title: 'Загрузка', message: this.message})
        }
    }
}