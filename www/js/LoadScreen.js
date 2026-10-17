class LoadScreen{
    constructor(amount, message = '', callback = null){
        this.counter = 0;
        this.amount = amount;
        this.message = message;
        this.callback = callback;
    }

    startLoad(){
        setTimeout(() => { 
            document.querySelector('#myNavigator').pushPage('./views/loadScreen.html').then(() => {
                const message = document.querySelector('#load_message');
                if (message) message.textContent = 'Пожалуйста, подождите. Выполняется загрузка данных.';
            });
         }, 400);
    }

    elementLoaded(){
        this.counter++;
        const stage = document.querySelector('#load_stage');
        if (stage) {
            const percent = this.amount > 0 ? Math.min(100, Math.round(this.counter / this.amount * 100)) : 100;
            stage.textContent = `${percent}%`;
        }
        if(this.counter >= this.amount){
            this.finishLoad()
        }
    }

    finishLoad(){
        setTimeout(() => {
            document.querySelector('#myNavigator').popPage();
            if (this.callback) {
                this.callback();
                return;
            }
            if (this.message != '') {
                ons.notification.alert({title: 'Загрузка', message: this.message});
            }
        }, 600);
    }
}
