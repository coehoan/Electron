<script>
    import {onMount} from "svelte";
    import {push} from "svelte-spa-router";

    let companyList = [];
    let selectedCompany;

    /* 기관 선택 */
    onMount(() => {
        window.api.request('getCompanyList');
    })

    window.api.response('step2-companyList', (data) => {
        companyList = data
    })
    window.api.response('step2-response', (data) => {
        if (data) {
            push('/step3');
        }
    })

    function next() {
        if (!!selectedCompany) {
            window.api.request('setBasicInfo', selectedCompany);
        } else alert('기관을 선택해주세요');
    }
</script>

<main>
    <p>기관을 선택해주세요.</p>
    <select bind:value={selectedCompany}>
        {#each companyList as company}
            <option value="{company.id}">{company.name}</option>
        {/each}
    </select>
    <button on:click={next}>다음</button>
</main>

<style>

</style>