<script>
    import {onMount} from "svelte";

    let info = [];
    let seq = '';
    let name = '';

    onMount(() => {
        window.api.response('response', (data) => {
            info = data;
        })
    })

    function create() {
        window.api.create('create', 'create table if not exists student (id integer primary key, name text, email text)');
    }
    function insert() {
        window.api.insert('insert', 'insert into student(name, email) values(\'학생1\', \'test1@naver.com\')');
    }
    function insert2() {
        window.api.insert('insert', 'insert into student(name, email) values(\'학생2\', \'test2@naver.com\')');
    }
    function del() {
        window.api.delete('delete');
    }
    function update() {
        window.api.update('update', `update student set name = '${name}' where id = ${seq}`);
    }
    function select() {
        window.api.select('select', 'select * from student');
    }

    function fileUpload() {
        window.api.file('file');
    }
    function exportFile() {
        window.api.exportFile('exportFile');
    }

    function goto() {
    }
</script>

<main>
    <h1>Hello!</h1>
    <button on:click={create}>CREATE</button>
    <button on:click={insert}>INSERT</button>
    <button on:click={insert2}>INSERT2</button>
    <button on:click={del}>DELETE</button>
    <button on:click={select}>SELECT</button>
    <br>
    <input style="width: 50px" bind:value={seq} placeholder="seq"/>
    <input style="width: 100px" bind:value={name} placeholder="name"/>
    <button on:click={update}>UPDATE</button>
    <br>
    <hr>
    <button on:click={fileUpload}>UPLOAD</button>
    <button on:click={exportFile}>EXPORT</button>
    <hr>
    <button on:click={goto}>NEXT</button>
    <hr>
    {#each info as i}
        <p>{i.id}. {i.name} {i.email}</p>
    {/each}
</main>

<style>
    main {
        text-align: center;
        padding: 1em;
        max-width: 240px;
        margin: 0 auto;
    }

    h1 {
        color: #ff3e00;
        text-transform: uppercase;
        font-size: 4em;
        font-weight: 100;
    }

    @media (min-width: 640px) {
        main {
            max-width: none;
        }
    }
</style>