let $ = function (sel) {
    return document.getElementById(sel);
};
window.addEventListener('load', start)

function start() {
    window.model.init();
    bindEvents();
    onFilterButtonClick('all-filter')
}

function bindEvents() {
    for (let btn of ['active-filter', 'completed-filter', 'all-filter']) {
        $(btn).onclick = () => { onFilterButtonClick(btn) };
    }
    $('new-todo-wrapper').onclick = onNewTodoClick;

    $('search-btn').onclick = () => {
        $('keyword').innerHTML = $('search').value;
        $('search').value = '';
        currentFilterExps['search'] = (item) => { return item.content.indexOf($('keyword').innerHTML) != -1 };
        update();
    }
    $('keyword').onclick = ()=>{$('keyword').innerHTML = '';update()};

    $('editor-accept').onclick = onEditorAcceptClick;
    $('editor-cancel').onclick = onEditorCancleClick;

    $('total-count').onclick = onStartBatchClick;
    $('select-all').onchange = onSelectAllChange;

    $('complete-batch').onclick = () => { batchOperate('complete') };
    $('active-batch').onclick = () => { batchOperate('active') };
    $('delete-batch').onclick = () => { batchOperate('delete') };
    $('toggle-batch').onclick = () => { batchOperate('toggle') };

    $('star-filter').onclick = onStarFilterClick;
    $('sort-type').onclick = onSortTypeClick;
    $('order').onclick = onOrderClick;
}

function onOrderClick(){
    if($('order').order == 'down')
    {
        $('order').order = 'up';
        $('order').setAttribute('src', 'res/up.png');
        SortOrder = 1;
    }
    else{
        $('order').order = 'down';
        $('order').setAttribute('src', 'res/down.png');
        SortOrder = -1;
    }
    update();
}

function onSortTypeClick(){
    if($('sort-type').sortType == 'time')
    {
        $('sort-type').sortType = 'name';
        $('sort-type').setAttribute('src', 'res/file.png');
        sortKey = 'name';
        update();
    }
    else{
        $('sort-type').sortType = 'time';
        $('sort-type').setAttribute('src', 'res/time.png');
        sortKey = 'time';
        update();
    }
}

function onStarFilterClick(e){
    e.preventDefault();
    $('star-filter').classList.toggle('clicked');
    let clicked = $('star-filter').classList.contains('clicked');
    if(clicked)
    {
        $('star-filter').setAttribute('src', 'res/star_filled.png');
        currentFilterExps['star'] = (item)=>{return item.star};
    }
    else{
        $('star-filter').setAttribute('src', 'res/star_blue.png');
        currentFilterExps['star'] = null;
    }
    update();
}

function onStartBatchClick() {
    $('card-container').classList.toggle('batched');
    $('card-meta').classList.toggle('clicked');
    if ($('card-meta').classList.contains('clicked')) {
        for (let cardRow of document.querySelectorAll('.card-row-1')) {
            cardRow.style.transform = '';
            cardRow.style.opacity = 1;
        }
    }
}

function onSelectAllChange() {
    let boxes = document.querySelectorAll('.card');
    let checked = $('select-all').checked;
    boxes.forEach((value) => {
        if (checked) {
            value.classList.add('batch-checked');
        }
        else {
            value.classList.remove('batch-checked');
        }
    })
}

let selectedFilterId; //id of selected filter
function onFilterButtonClick(id) {
    if (selectedFilterId && selectedFilterId != id) {
        $(selectedFilterId).classList.remove('filtered');
    }
    selectedFilterId = id;
    $(selectedFilterId).classList.add('filtered');
    $(id).disabled = true;
    switch (id) {
        case 'active-filter':
            currentFilterExps['main-filter'] = (item) => {
                return item.completed == false;
            };
            break;
        case 'completed-filter':
            currentFilterExps['main-filter'] = (item) => {
                return item.completed == true;
            };
            break;
        case 'all-filter':
            currentFilterExps['main-filter'] = () => {
                return true;
            };
            break;
    }
    //todo
    $('search').value = '';
    $('star-filter').classList.remove('clicked');
    $('star-filter').setAttribute('src', 'res/star_blue.png');
    update();
}

function batchOperate(opt) {
    let cards = document.querySelectorAll('.card');
    for (let card of cards.values())
        if (card.classList.contains('batch-checked')) {
            switch (opt) {
                case 'complete':
                    card.classList.add('completed');
                    card.item.completed = true;
                    break;
                case 'active':
                    card.classList.remove('completed');
                    card.item.completed = false;
                    break;
                case 'delete':
                    deleteItem(cards.item);
                    break;
                case 'toggle':
                    card.classList.toggle('completed');
                    card.item.completed = card.classList.contains('completed');
                    break;
            }
        }
    if (opt == 'delete') update();
    else flush();
}

let currentFilterExps={};
let SortOrder = 1;
let sortKey = 'name';
function update() {
    flush();
    $("card-container").innerHTML = '';

    let exp = (item)=>{
        for(let i in currentFilterExps)
        {
            if(currentFilterExps[i]&&!currentFilterExps[i](item))
            {
                return false;
            }
        }
        return true;
    }

    let sortFunc;
    switch (sortKey) {
        case 'name':
            sortFunc = (lhs, rhs) => { return (lhs.content > rhs.content ? 1 : -1) * SortOrder };
            break;
        case 'time':
            sortFunc =  (lhs, rhs) => {
                let time1 = new Date(lhs.createdTime).getTime();
                let time2 = new Date(rhs.createdTime).getTime();
                return (time1 > time2 ? 1 : -1) * SortOrder;
            }
            break;
    }
    let items = window.model.data.items.slice(0);
    items.sort(sortFunc);

    window.numQualified = 0;
    for (let item in items) {
        if (exp(items[item])) {
            createTodoCard(items[item]);
            window.numQualified++;
        }
    }
    let length = window.numQualified;
    $('total-count').innerHTML = length + (length == 1 ? " item" : " items") + " found";
}

function flush() {
    window.model.flush();
}

function createTodoCard(item) {
    let card = document.createElement("div");
    card.item = item;
    card.className = "card";
    if (item.completed)
        card.classList.add('completed');
    $('card-container').appendChild(card);

    let cardRow1 = document.createElement('div');
    cardRow1.className = "card-row-1";
    card.appendChild(cardRow1);

    // let checkBoxWrapper = document.createElement('div');
    // checkBoxWrapper.className = 'checkbox-wrapper';
    // let checkBox = document.createElement('input');
    // checkBox.type = 'checkBox';
    // checkBox.classList.add('card-checkbox');
    // cardRow1.appendChild(checkBoxWrapper);
    // checkBoxWrapper.appendChild(checkBox);
    // card.isChecked = ()=>{return checkBox.checked};

    let checkRegion = document.createElement('img');
    checkRegion.className = 'card-check';
    checkRegion.setAttribute('src', 'res/yes.png');
    checkRegion.onclick = () => {
        card.classList.toggle('batch-checked');
    }
    cardRow1.appendChild(checkRegion);

    let cardStar = document.createElement('img');
    cardStar.className = 'card-star';
    let starFunc = ()=>{
        cardStar.setAttribute('src', item.star?'res/star_filled.png':'res/star_blue.png');
        if(item.star)
        {
            cardStar.classList.add('stared');
        }
        else{
            cardStar.classList.remove('stared');
        }
    }
    starFunc();
    cardStar.onclick = ()=>{
        item.star = !item.star;
        starFunc();
        flush();
    }
    cardRow1.appendChild(cardStar);

    let label = document.createElement('div');
    label.className = "card-label"
    label.innerText = item.content;
    cardRow1.appendChild(label);

    //card delete button
    let cardDelete = document.createElement("button");
    cardDelete.className = 'card-delete';
    cardDelete.innerHTML = "remove";
    cardDelete.onclick = () => { deleteItem(item) };
    cardRow1.appendChild(cardDelete);

    let startX, startY, longTapTimer, moveX, moveY;
    let offsetX = 0; // starting x offset of the label
    label.addEventListener('touchstart', function (e) {
        e.preventDefault();
        if ($('card-container').classList.contains('batched')) {
            return;
        }
        var touch = e.touches[0];
        startX = touch.pageX;
        startY = touch.pageY;
        longTapTimer = setTimeout(function () {
            // editTodo(item);
            longTapTimer = null;
            editSingleTodo(card);
            if (moveX + offsetX < -cardDelete.offsetWidth * 0.8) {
                cardRow1.style.transform = 'translate(' + -cardDelete.offsetWidth + 'px, ' + 0 + 'px)';
                cardRow1.style.opacity = (1 - Math.abs(moveX) / 300).toFixed(1);
                offsetX = -cardDelete.offsetWidth;
            } else {
                cardRow1.style.transform = '';
                cardRow1.style.opacity = '';
                offsetX = 0;
            }
        }, 500);
    });

    label.addEventListener('touchmove', function (e) {
        e.preventDefault();
        if ($('card-container').classList.contains('batched')) {
            return;
        }
        let touch = e.touches[0];
        moveX = touch.pageX - startX;
        moveY = touch.pageY - startY;
        if (moveX + offsetX > 0) {
            moveX = -offsetX;
        } else if (moveX + offsetX < -cardDelete.offsetWidth) {
            moveX = -cardDelete.offsetWidth - offsetX;
        }

        if ((Math.abs(moveX) > 5 || Math.abs(moveY) > 5) && longTapTimer != null) {
            clearTimeout(longTapTimer);
            longTapTimer = null;
        }

        if (Math.abs(moveY) < 20) {
            e.preventDefault();
            cardRow1.style.transform = 'translate(' + (moveX + offsetX) + 'px, ' + 0 + 'px)';
            cardRow1.style.opacity = (1 - Math.abs(moveX + offsetX) / 300).toFixed(1);
        }
    });

    label.addEventListener('touchend', function (e) {
        e.preventDefault();
        if ($('card-container').classList.contains('batched')) {
            return;
        }
        if (longTapTimer != null) {
            clearTimeout(longTapTimer);
            longTapTimer = null;
            selectCard(card);
            return;
        }
        if (moveX + offsetX < -cardDelete.offsetWidth * 0.8) {
            cardRow1.style.transform = 'translate(' + -cardDelete.offsetWidth + 'px, ' + 0 + 'px)';
            cardRow1.style.opacity = (1 - Math.abs(moveX) / 300).toFixed(1);
            offsetX = -cardDelete.offsetWidth;
        } else {
            // cardRow1.style.transform = 'translate(' + 0 + 'px, ' + 0 + 'px)';
            cardRow1.style.transform = '';
            cardRow1.style.opacity = '';
            offsetX = 0;
        }
    });

    let cardRow2 = document.createElement('div');
    cardRow2.className = 'card-row-2';
    card.appendChild(cardRow2);

    let createdTime = document.createElement('div')
    createdTime.innerHTML = 'Create : ' + Date2Str(item.createdTime);
    cardRow2.appendChild(createdTime);

    // if(item.editTime)
    // {
    //     let modifiedTime = document.createElement('div')
    //     modifiedTime.innerHTML = 'Modify: ' + item.editTime;
    //     cardRow2.appendChild(modifiedTime);
    // }

    let activeButton = document.createElement('button');
    activeButton.classList.add('active-button');
    activeButton.innerHTML = item.completed ? 'completed' : 'active';
    activeButton.onclick = () => {
        item.completed = !item.completed;
        card.classList.toggle('completed');
        activeButton.innerHTML = item.completed ? 'completed' : 'active';
        flush();
    }
    cardRow2.appendChild(activeButton);

    let cardEditButtons = document.createElement('div');
    cardEditButtons.className = 'edit-button-container';
    // cardRow2.appendChild(cardEditButtons);

    let smallModifyButton = document.createElement('button');
    smallModifyButton.className = 'small-modify-button style3';
    smallModifyButton.innerHTML = '改';
    cardEditButtons.appendChild(smallModifyButton);
    let smallDeleteButton = document.createElement('button');
    smallDeleteButton.className = 'small-delete-button';
    smallDeleteButton.innerHTML = '删';
    smallDeleteButton.onclick = () => {
        deleteItem(item)
    };
    cardEditButtons.appendChild(smallDeleteButton);
    return card;
}

function editSingleTodo(card) {
    $('editor-head').innerHTML = 'Edit Todo';
    $('editor-label').innerHTML = 'Write new todo info here';
    $('editor-text').value = card.item.content;
    $('editor-accept').editingCard = card;
    showEditor();
}

let selectedCard;
function selectCard(card) {
    if (selectedCard) {
        selectedCard.classList.remove('selected');
    }
    if (selectedCard != card) {
        selectedCard = card;
        selectedCard.classList.add('selected');
    }
    else {
        selectedCard.classList.remove('selected');
        selectedCard = null;
    }
}

function deleteItem(item) {
    let items = window.model.data.items;
    let index = items.indexOf(item);
    items.splice(index, 1);
    update();
}

function onNewTodoClick() {
    $("new-todo-wrapper").classList.add("clicked");
    $('editor-head').innerHTML = 'New Todo';
    $('editor-label').innerHTML = 'Write your new todo here';
    $('editor-text').value = '';

    window.setTimeout(showEditor, 200);
}

function showEditor() {
    $("editor").classList.remove("hidden");

    $("new-todo-wrapper").classList.add("hidden");

    $("editor-text").focus();
}

function Date2Str(date_) {
    let date = new Date(date_);
    var curYear = date.getFullYear();
    var curMonth = date.getMonth() + 1;
    var curDate = date.getDate();
    var curHours = date.getHours();
    var curMinutes = date.getMinutes();
    if (curMonth < 10) {
        curMonth = '0' + curMonth;
    }
    if (curDate < 10) {
        curDate = '0' + curDate;
    }
    if (curHours < 10) {
        curHours = '0' + curHours;
    }
    if (curMinutes < 10) {
        curMinutes = '0' + curMinutes;
    }

    var curtime = curYear + ':' + curMonth + ':' + curDate + ' ' + curHours + ':' + curMinutes;
    return curtime;
}

function onEditorAcceptClick() {
    let text = $('editor-text').value;
    if (text) {
        if ($('editor-head').innerHTML == 'Edit Todo' && $('editor-accept').editingCard) {
            $('editor-accept').editingCard.item.content = text;
            $('editor-accept').editingCard.item.editTime = todayTime();
            $('editor-accept').editingCard = null;
        }
        else {
            let item = {
                content: text,
                completed: false,
                createdTime: new Date().toString(),
                editTime: '',
                star: false
            }
            window.model.data.items.push(item);
        }
        $("new-todo-wrapper").classList.remove("hidden");
        $("editor").classList.add("hidden");
        $('editor-text').value = '';
        update();
    }
}

function onEditorCancleClick() {
    $("editor").classList.add("hidden");
    $('editor-text').value = '';
    $("new-todo-wrapper").classList.remove("hidden");
}