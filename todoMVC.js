let $ = function (sel) {
    return document.getElementById(sel);
};
window.addEventListener('load', start)

function start() {
    window.model.init();
    bindEvents();
    resetEditor();
    onFilterButtonClick('all-filter')
}

function bindEvents() {
    for (let btn of ['active-filter', 'all-filter']) {
        $(btn).onclick = () => { onFilterButtonClick(btn) };
    }
    bindDeleteComplete();

    $('new-todo-wrapper').onclick = onNewTodoClick;

    $('search-btn').onclick = () => {
        $('keyword').innerHTML = $('search').value;
        if ($('search').value) {
            $('keyword').classList.add('using');
        }
        else {
            $('keyword').classList.remove('using');
        }
        $('search').value = '';
        currentFilterExps['search'] = (item) => { return item.content.indexOf($('keyword').innerHTML) != -1 };
        update();
    }
    $('keyword').onclick = () => {
        $('keyword').innerHTML = '';
        $('keyword').classList.remove('using');
        update()
    };

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

function onOrderClick() {
    if ($('order').order == 'down') {
        $('order').order = 'up';
        $('order').setAttribute('src', 'res/up.png');
        SortOrder = 1;
    }
    else {
        $('order').order = 'down';
        $('order').setAttribute('src', 'res/down.png');
        SortOrder = -1;
    }
    update();
}

function onSortTypeClick() {
    if ($('sort-type').sortType == 'time') {
        $('sort-type').sortType = 'ddl';
        $('sort-type').setAttribute('src', 'res/calendar.png');
        sortKey = 'ddl';
        update();
    }
    else if ($('sort-type').sortType == 'ddl') {
        $('sort-type').sortType = 'name';
        $('sort-type').setAttribute('src', 'res/file.png');
        sortKey = 'name';
        update();
    }
    else {
        $('sort-type').sortType = 'time';
        $('sort-type').setAttribute('src', 'res/time.png');
        sortKey = 'time';
        update();
    }
}

function onStarFilterClick(e) {
    e.preventDefault();
    $('star-filter').classList.toggle('clicked');
    let clicked = $('star-filter').classList.contains('clicked');
    if (clicked) {
        $('star-filter').setAttribute('src', 'res/star_filled.png');
        currentFilterExps['star'] = (item) => { return item.star };
    }
    else {
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

    // $('search').value = '';
    // $('star-filter').classList.remove('clicked');
    // $('star-filter').setAttribute('src', 'res/star_blue.png');
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

let currentFilterExps = {};
let SortOrder = 1;
let sortKey = 'name';
function update() {
    flush();
    $("card-container").innerHTML = '';

    let exp = (item) => {
        for (let i in currentFilterExps) {
            if (currentFilterExps[i] && !currentFilterExps[i](item)) {
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
            sortFunc = (lhs, rhs) => {
                let time1 = new Date(lhs.createdTime).getTime();
                let time2 = new Date(rhs.createdTime).getTime();
                return (time1 > time2 ? 1 : -1) * SortOrder;
            }
            break;
        case 'ddl':
            sortFunc = (lhs,rhs) => {
                let ddl1 = htmlDateToArray(lhs.ddl);
                let ddl2 = htmlDateToArray(rhs.ddl);
                let time1 = new Date(ddl1[0],ddl1[1],ddl1[2]).getTime();
                let time2 = new Date(ddl2[0],ddl2[1],ddl2[2]).getTime();
                return (time1 > time2 ? 1 : -1) * SortOrder;
            }
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

function bindDeleteComplete(){
    let startX, startY, longTapTimer, moveX, moveY;
    let offsetX = 0;
    let deleteCompleted = $('delete-completed');
    let completedFilter = $('completed-filter');
    let isClicked = true;
    completedFilter.addEventListener('touchstart', function (e) {
        e.preventDefault();
        isClicked = true;
        var touch = e.touches[0];
        startX = touch.pageX;
        startY = touch.pageY;
        longTapTimer = setTimeout(function () {isClicked = false}, 500);
    });

    completedFilter.addEventListener('touchmove', function (e) {
        e.preventDefault();
        if ($('card-container').classList.contains('batched')) {
            return;
        }
        let touch = e.touches[0];
        moveX = touch.pageX - startX;
        moveY = touch.pageY - startY;
        if (moveX + offsetX > 0) {
            moveX = -offsetX;
        } else if (moveX + offsetX < -deleteCompleted.offsetWidth) {
            moveX = -deleteCompleted.offsetWidth - offsetX;
        }

        if ((Math.abs(moveX) > 5 || Math.abs(moveY) > 5)) {
            isClicked = false;
        }

        if (Math.abs(moveY) < 20) {
            completedFilter.style.transform = 'translate(' + (moveX + offsetX) + 'px, ' + 0 + 'px)';
        }
    });

    completedFilter.addEventListener('touchend', function (e) {
        e.preventDefault();
        if (isClicked) {
            clearTimeout(longTapTimer);
            longTapTimer = null;
            if(offsetX == 0)
            {
                onFilterButtonClick('completed-filter');
            }
            else{
                clearCompleted();
                offsetX = 0;
                moveX = 0;
            }
        }
        if (moveX + offsetX < -deleteCompleted.offsetWidth * 0.8) {
            completedFilter.style.transform = 'translate(' + -deleteCompleted.offsetWidth + 'px, ' + 0 + 'px)';
            offsetX = -deleteCompleted.offsetWidth;
        } else {
            // cardRow1.style.transform = 'translate(' + 0 + 'px, ' + 0 + 'px)';
            completedFilter.style.transform = '';
            offsetX = 0;
        }
    });
}

function clearCompleted(){
    let completedItems = [];
    for(let item of window.model.data.items){
        if(item.completed)
        {
            completedItems.push(item);
        }
    }
    completedItems.forEach(deleteItem);
    update();
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
    let starFunc = () => {
        cardStar.setAttribute('src', item.star ? 'res/star_filled.png' : 'res/star_blue.png');
        if (item.star) {
            cardStar.classList.add('stared');
        }
        else {
            cardStar.classList.remove('stared');
        }
    }
    starFunc();
    cardStar.onclick = () => {
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
    cardDelete.onclick = () => { 
        deleteItem(item) 
        update();
    };
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
    createdTime.innerHTML = '<div class="info-head">Created</div><div class="info-content">' + Date2Str(item.createdTime) + '</div>';
    createdTime.classList.add('card-info');
    cardRow2.appendChild(createdTime);

    if(item.ddl)
    {
        let ddlRow = document.createElement('div')
        ddlRow.innerHTML = 'DDL: ' + item.ddl;
        ddlRow.innerHTML = '<div class="info-head">DDL</div><div class="info-content">' + item.ddl + '</div>';
        ddlRow.classList.add('card-info');
        if(isHtmlDataPast(htmlDateToArray(item.ddl)))
        {
            card.classList.add('delayed');
        }
        cardRow2.appendChild(ddlRow);
    }

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

    return card;
}

function editSingleTodo(card) {
    $('editor-head').innerHTML = 'Edit Todo';
    $('editor-label').innerHTML = 'Write new todo info here';
    $('editor-text').value = card.item.content;
    if(card.item.ddl){
        $('ddl').value = card.item.ddl;
    }
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

function onEditorAcceptClick() {
    let text = $('editor-text').value;
    if (text) {
        if ($('editor-head').innerHTML == 'Edit Todo' && $('editor-accept').editingCard) {
            $('editor-accept').editingCard.item.content = text;
            $('editor-accept').editingCard.item.ddl = $('ddl').value;
            // $('editor-accept').editingCard.item.editTime = todayTime();
            $('editor-accept').editingCard = null;
        }
        else {
            let item = {
                content: text,
                completed: false,
                createdTime: new Date().toString(),
                editTime: '',
                star: false,
                ddl: $('ddl').value
            }
            window.model.data.items.push(item);
        }
        $("new-todo-wrapper").classList.remove("hidden");
        $("editor").classList.add("hidden");
        resetEditor();
        update();
    }
}

function onEditorCancleClick() {
    $("editor").classList.add("hidden");
    $('editor-text').value = '';
    $("new-todo-wrapper").classList.remove("hidden");
    resetEditor();
}

function resetEditor()
{
    //reset value
    $('editor-text').value = '';
    //reset ddl
    let today = new Date();
    let month = (today.getMonth()+1) < 10 ? '0' + (today.getMonth()+1) : (today.getMonth()+1) + '';
    let day = today.getDate() < 10 ? '0' + today.getDate() : today.getDate() + '';
    $('ddl').value = today.getFullYear() + '-' + month + '-' + day;
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

function htmlDateToArray(date)
{
    return [parseInt(date.split('-')[0]), parseInt(date.split('-')[1]), parseInt(date.split('-')[2])];
}

function isHtmlDataPast(dateArray){
    let givenDate = new Date(dateArray[0], dateArray[1], dateArray[2], 0, 0, 0);
    if (givenDate.getTime() > Date.now()){
        return false;
    }
    else{
        return true;
    }
    
}