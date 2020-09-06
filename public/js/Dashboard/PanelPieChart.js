/////////////////////////////////////////////////////////////////////
// Copyright (c) Autodesk, Inc. All rights reserved
// Written by Forge Partner Development
//
// Permission to use, copy, modify, and distribute this software in
// object code form for any purpose and without fee is hereby granted,
// provided that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
/////////////////////////////////////////////////////////////////////

class PieChart extends DashboardPanelChart {
    constructor(property) {
        super();
        this.propertyToUse = property;
    }

    load(parentDivId, viewer, modelData) {
        if (!super.load(parentDivId, this.constructor.name, viewer, modelData)) return;
        // this.drawChart();
        this.drawSearch();
    }

    drawChart() {
        var _this = this; // need this for the onClick event

        var ctx = document.getElementById(this.canvasId).getContext('2d');
        if (this.chart !== undefined) this.chart.destroy();
        var colors = this.generateColors(this.modelData.getLabels(this.propertyToUse).length);

        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: this.modelData.getLabels(this.propertyToUse),
                datasets: [{
                    data: this.modelData.getCountInstances(this.propertyToUse),
                    backgroundColor: colors.background,
                    borderColor: colors.borders,
                    borderWidth: 1
                }]
            },
            options: {
                legend: {
                    display: false
                },
                'onClick': function (evt, item) {
                    _this.viewer.isolate(_this.modelData.getIds(_this.propertyToUse, item[0]._model.label));
                    _this.viewer.utilities.fitToView();
                }
            }
        });
    }

    drawSearch() {
        var _this = this;
        console.log('model data ---->', Object.keys(this.modelData._modelData.Level));
        var results = {
            select1: {
                selectedType: "",
                selectedBoolean: "",
                selectedItem: "",
                selectedIds: []
            }
        };
        var selectType = ["Category", "Description", "Level"];
        var selectTypeHtml = '<select class="selectTypes"><option value="">Please select</option></select>';
        var selectBoolean = ["equals", "contain"];
        var selectBooleanHtml = '<select class="selectBoolean" disabled><option value="">Please select</option></select>';
        var selectItemHTML = '<select class="selectItem" disabled><option value="">Please select</option></select>';
        $('#dashboard').append(
            `<div class="searchContainer">
                Filtery by:
                ${selectTypeHtml}
                ${selectBooleanHtml}
                ${selectItemHTML}
                <button class="filterButton" disabled>Filter</button>
            </div>`
        );
        selectType.forEach(function(item) {
            $('.selectTypes').append(`<option value="${item}">${item}</option>`);
        });
        selectBoolean.forEach(function(item) {
            $('.selectBoolean').append(`<option value="${item}">${item}</option>`);
        });

        function checkValid() {
            ($(".selectTypes").val() && $(".selectBoolean").val() && $(".selectItem").val()) ?
            $(".filterButton").prop("disabled", false) : $(".filterButton").prop("disabled", true);
        };

        function resetItems() {
            $('.selectItem').empty();
            $('.selectItem').val("");
            $('.selectItem').append('<option value="">Please select</option>');
            results.select1.selectedIds = [];
            checkValid();
        }

        function getItemsIds() {
            var currentType = results.select1.selectedType;
            var currentBoolean = results.select1.selectedBoolean;
            var currentItem = results.select1.selectedItem;
            if (currentBoolean && currentItem) {
                if (currentBoolean === "equals") {
                    results.select1.selectedIds = _this.modelData.getIds(currentType, currentItem);
                } else if (currentBoolean === "contain") {
                    var itemsArray = Object.keys(_this.modelData._modelData[currentType]).filter(function(item) {
                        return item.includes(currentItem);
                    });
                    var idsArray = [];
                    itemsArray.forEach(function(item) {
                        idsArray.push(_this.modelData.getIds(currentType, item));
                    });
                    results.select1.selectedIds = idsArray.reduce(function(arr1, arr2) {
                        return arr1.concat(arr2);
                    });
                };
            };
        };

        $(".selectTypes").change(function() {
            checkValid();
            var selectedType = $(".selectTypes").val();
            var selectedBoolean = $(".selectBoolean").val();
            results.select1.selectedType = $(".selectTypes").val();
            if (selectedType) {
                $(".selectBoolean").prop("disabled", false);
                resetItems();
                Object.keys(_this.modelData._modelData[selectedType]).forEach(function(item) {
                    $('.selectItem').append(`<option value="${item}">${item}</option>`);
                });
            } else {
                $(".selectBoolean").prop("disabled", true);
                $(".selectItem").prop("disabled", true);
            };

            if (selectedType && selectedBoolean) {
                $(".selectItem").prop("disabled", false);
            }
        });

        $(".selectBoolean").change(function() {
            checkValid()
            var selectedBoolean = $(".selectBoolean").val();
            results.select1.selectedBoolean = $(".selectBoolean").val();
            getItemsIds();
            selectedBoolean ? $(".selectItem").prop("disabled", false) : $(".selectItem").prop("disabled", true);
        });

        $(".selectItem").change(function() {
            checkValid()
            results.select1.selectedItem = $(".selectItem").val();
            getItemsIds();
        });

        $(".filterButton").click(function() {
            var resultsArr = [];
            Object.keys(results).forEach(function(select) {
                return resultsArr.push(results[select].selectedIds);
            });
            _this.viewer.isolate(resultsArr[0]);
            _this.viewer.utilities.fitToView();
        });
    }
}