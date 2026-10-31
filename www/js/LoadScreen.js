class LoadScreen{
    constructor(amount, message = '', callback = null, mode = 'default'){
        this.counter = 0;
        this.amount = amount;
        this.message = message;
        this.callback = callback;
        this.mode = mode;
        this.pageReady = null;
        this.screen = null;
        this.finishing = false;
    }

    startLoad(){
        this.pageReady = new Promise(resolve => {
            setTimeout(() => {
                document.querySelector('#myNavigator').pushPage('./views/loadScreen.html', {
                    data: { loadScreen: { mode: this.mode, amount: this.amount } }
                }).then(page => {
                    const screen = page.querySelector('.load-screen');
                    this.screen = screen;
                    this.updateProgress();
                    resolve();
                });
            }, 400);
        });
    }

    elementLoaded(){
        this.counter++;
        this.updateProgress();
        if(this.counter >= this.amount){
            this.finishLoad();
        }
    }

    updateProgress(){
        const stage = this.screen?.querySelector('#load_stage');
        if (stage) {
            if (this.mode === 'kml-import') {
                stage.textContent = `${Math.min(this.counter, this.amount)} из ${this.amount}`;
            } else {
                const percent = this.amount > 0 ? Math.min(100, Math.round(this.counter / this.amount * 100)) : 100;
                stage.textContent = `${percent}%`;
            }
        }
    }

    finishLoad(){
        if (this.finishing) return;
        this.finishing = true;
        (this.pageReady || Promise.resolve()).then(() => setTimeout(() => {
            document.querySelector('#myNavigator').popPage();
            if (this.callback) {
                this.callback();
                return;
            }
            if (this.message != '') {
                ons.notification.alert({title: 'Загрузка', message: this.message});
            }
        }, 600));
    }
}
